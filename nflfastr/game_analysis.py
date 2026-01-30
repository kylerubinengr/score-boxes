import streamlit as st
import nfl_data_py as nfl
import pandas as pd
import numpy as np
import matplotlib.colors as mcolors
import sys
import argparse
import json
import os
import contextlib

@contextlib.contextmanager
def suppress_stdout():
    with open(os.devnull, "w") as devnull:
        old_stdout = sys.stdout
        sys.stdout = devnull
        try:
            yield
        finally:
            sys.stdout = old_stdout

# Check if running in CLI mode based on arguments
# We assume CLI mode if the specific argument '--game_id' is present.
CLI_MODE = "--game_id" in sys.argv

# If explicitly running via streamlit command, streamlit module is fully loaded and active.
# However, when running 'python game_analysis.py ...', we want to avoid st calls that require a server.

if not CLI_MODE:
    # Set page config for wider layout - Only in Streamlit mode
    try:
        st.set_page_config(page_title="NFL Game Analysis", layout="wide")
    except Exception:
        pass # Ignore if not in a valid streamlit context

# --- Caching Decorator Wrapper ---
def cache_data_wrapper(func):
    if not CLI_MODE and 'streamlit' in sys.modules:
        return st.cache_data(func)
    return func

# --- Data Loading with Caching ---

@cache_data_wrapper
def load_schedule(year):
    """Loads schedule data."""
    df = nfl.import_schedules([year])
    return df

@cache_data_wrapper
def load_pbp_data(year, use_disk_cache=False):
    """Loads PBP data for the entire season."""
    if use_disk_cache:
        try:
            df = nfl.import_pbp_data([year], cache=True)
            return df
        except Exception:
            pass  # Fall through to network download if cache miss
    df = nfl.import_pbp_data([year])
    return df

@cache_data_wrapper
def load_team_info():
    """Loads team information including logos."""
    df = nfl.import_team_desc()
    return df[['team_abbr', 'team_logo_espn']]

# --- Metrics Calculation Functions ---

def calculate_metrics(df):
    if len(df) == 0:
        return pd.Series({'EPA/Play': np.nan, 'Success Rate': np.nan, '1st Down %': np.nan, 'Plays': 0})
    
    epa_per_play = df['epa'].mean()
    success_rate = df['success'].mean()
    first_down_pct = df['first_down'].mean()
    
    return pd.Series({
        'EPA/Play': epa_per_play, 
        'Success Rate': success_rate, 
        '1st Down %': first_down_pct,
        'Plays': len(df)
    })

def get_team_stats(df, team_abbr):
    team_df = df[df['posteam'] == team_abbr]
    
    early_df = team_df[team_df['down'].isin([1, 2])]
    late_df = team_df[team_df['down'].isin([3, 4])]

    splits = {
        'All Plays': team_df,
        'Rush': team_df[team_df['is_run'] == 1],
        'Pass': team_df[team_df['is_pass'] == 1],
        'Early Downs (1st/2nd)': early_df,
        'Early Rush': early_df[early_df['is_run'] == 1],
        'Early Pass': early_df[early_df['is_pass'] == 1],
        'Late Downs (3rd/4th)': late_df,
        'Late Rush': late_df[late_df['is_run'] == 1],
        'Late Pass': late_df[late_df['is_pass'] == 1],
    }
    
    stats = {}
    for label, split_df in splits.items():
        stats[label] = calculate_metrics(split_df)
        
    return pd.DataFrame(stats).T

def calculate_player_metrics(group):
    if len(group) == 0:
        return pd.Series()
        
    epa_per_play = group['epa'].mean()
    total_epa = group['epa'].sum()
    success_rate = group['success'].mean()
    first_down_pct = group['first_down'].mean()
    
    return pd.Series({
        'EPA/play': epa_per_play,
        'Total EPA': total_epa,
        'SR': success_rate,
        '1st%': first_down_pct,
        'Count': len(group)
    })

def get_player_stats_table(df, groupby_col, sort_col='Total EPA'):
    if df.empty:
        return pd.DataFrame()
        
    stats = df.groupby(groupby_col).apply(calculate_player_metrics)
    
    if stats.empty:
        return pd.DataFrame()
        
    stats = stats.sort_values(sort_col, ascending=False)
    # Ensure the groupby column (player name) is preserved as a column for JSON export
    stats = stats.reset_index()
    return stats

def get_team_player_stats(df, team_abbr):
    team_df = df[df['posteam'] == team_abbr]
    
    # Passing
    pass_df = team_df[team_df['qb_dropback'] == 1]
    passing_stats = get_player_stats_table(pass_df, 'passer_player_name')
    
    # Rushing
    rush_df = team_df[(team_df['rush_attempt'] == 1) & (team_df['qb_dropback'] == 0)]
    rushing_stats = get_player_stats_table(rush_df, 'rusher_player_name')
    
    # Receiving
    target_df = team_df[(team_df['pass_attempt'] == 1) & (team_df['receiver_player_name'].notna())]
    receiving_stats = get_player_stats_table(target_df, 'receiver_player_name')
    
    return passing_stats, rushing_stats, receiving_stats

def process_game_data(game_id, season, pbp_season=None):
    """Processes PBP data for a specific game."""
    if pbp_season is None:
        pbp_season = load_pbp_data(season)
    
    # Filter for selected game
    game_data = pbp_season[pbp_season['game_id'] == game_id].copy()

    if game_data.empty:
        return None

    # Filter Garbage Time (WP 5-95%)
    game_data_filtered = game_data[
        (game_data['wp'] >= 0.05) & (game_data['wp'] <= 0.95)
    ]

    # Filter Non-Plays
    game_data_filtered = game_data_filtered[
        (game_data_filtered['play_type'].isin(['pass', 'run'])) &
        (game_data_filtered['qb_kneel'] == 0) &
        (game_data_filtered['qb_spike'] == 0)
    ]

    # Define Run/Pass
    game_data_filtered['is_pass'] = np.where(game_data_filtered['qb_dropback'] == 1, 1, 0)
    game_data_filtered['is_run'] = np.where(
        (game_data_filtered['play_type'] == 'run') & (game_data_filtered['qb_dropback'] == 0), 1, 0
    )
    
    return game_data_filtered

# --- Visualization Styling ---

def get_rbsdm_cmap():
    """Creates a custom colormap: Light Purple -> White -> Light Green."""
    colors = ["#d6b4fc", "#ffffff", "#b4fcb4"] 
    cmap = mcolors.LinearSegmentedColormap.from_list("rbsdm_custom", colors)
    return cmap

def style_dataframe(df):
    """Applies RBSDM-like styling."""
    styled = df.style.format({
        'EPA/Play': '{:.2f}',
        'Success Rate': '{:.1%}',
        '1st Down %': '{:.1%}',
        'Plays': '{:.0f}'
    })
    
    cmap = get_rbsdm_cmap()
    
    # EPA Coloring (Diverging)
    styled = styled.background_gradient(
        cmap=cmap, 
        subset=['EPA/Play'], 
        vmin=-0.6, vmax=0.6
    )
    
    # Success Rate (Sequential - keep Green)
    styled = styled.background_gradient(
        cmap='Greens', 
        subset=['Success Rate', '1st Down %'],
        vmin=0.3, vmax=0.6
    )
    
    return styled

def style_player_dataframe(df):
    if df.empty:
        return df
        
    cols_to_show = ['EPA/play', 'Total EPA', 'SR', '1st%']
    display_df = df[cols_to_show]
    
    styled = display_df.style.format({
        'EPA/play': '{:.2f}',
        'Total EPA': '{:.2f}',
        'SR': '{:.0%}',
        '1st%': '{:.0%}'
    })
    
    cmap = get_rbsdm_cmap()
    
    styled = styled.background_gradient(
        cmap=cmap, 
        subset=['EPA/play', 'Total EPA'], 
        vmin=-0.5, vmax=0.5
    )
    
    styled = styled.background_gradient(
        cmap='Greens', 
        subset=['SR', '1st%'],
        vmin=0.3, vmax=0.6
    )
    
    return styled

# --- Mode Execution ---

def run_streamlit_app():
    st.title("NFL Game Analysis")

    # --- Season Selection ---
    years = list(range(2025, 2009, -1)) # Descending order
    season = st.selectbox("Select Season:", years, index=years.index(2024) if 2024 in years else 0)

    # Select Season (Default to user selection)
    try:
        schedule = load_schedule(season)
    except Exception as e:
        st.error(f"Error loading schedule: {e}")
        st.stop()

    # --- Game Selection UI (Two-Step) ---

    # Step 1: Select Week
    available_weeks = sorted(schedule['week'].unique())
    selected_week = st.selectbox("Select Week:", available_weeks)

    # Step 2: Select Game from that Week
    week_games = schedule[schedule['week'] == selected_week].copy()

    # Create formatted game labels
    week_games['game_label'] = (
        week_games['away_team'] + " @ " + week_games['home_team']
    )

    # Sort by game_id to keep order consistent
    week_games = week_games.sort_values('game_id')

    game_map = pd.Series(week_games.game_id.values, index=week_games.game_label).to_dict()

    if not game_map:
        st.warning("No games found for this week.")
        st.stop()

    selected_label = st.selectbox("Select Game:", list(game_map.keys()))
    selected_game_id = game_map[selected_label]

    # Get Team Names and Logos
    game_info = week_games[week_games['game_id'] == selected_game_id].iloc[0]
    home_team = game_info['home_team']
    away_team = game_info['away_team']

    team_info = load_team_info()
    home_logo = team_info[team_info['team_abbr'] == home_team]['team_logo_espn'].values[0] if not team_info[team_info['team_abbr'] == home_team].empty else None
    away_logo = team_info[team_info['team_abbr'] == away_team]['team_logo_espn'].values[0] if not team_info[team_info['team_abbr'] == away_team].empty else None

    # --- Data Processing ---

    with st.spinner("Loading Play-by-Play Data..."):
        pbp_season = load_pbp_data(season)

    game_data_filtered = process_game_data(selected_game_id, season, pbp_season)

    if game_data_filtered is None or game_data_filtered.empty:
        st.warning("No play-by-play data found for this game yet (or all plays filtered out).")
        st.stop()

    home_stats = get_team_stats(game_data_filtered, home_team)
    away_stats = get_team_stats(game_data_filtered, away_team)

    # --- Head-to-Head Display ---

    col1, col2 = st.columns(2)

    with col1:
        # Away Team Header with Logo
        sub_c1, sub_c2 = st.columns([1, 4])
        with sub_c1:
            if away_logo:
                st.image(away_logo, width=80)
        with sub_c2:
            st.subheader(f"{away_team}")
        
        st.dataframe(style_dataframe(away_stats), use_container_width=True)

    with col2:
        # Home Team Header with Logo
        sub_c1, sub_c2 = st.columns([1, 4])
        with sub_c1:
            if home_logo:
                st.image(home_logo, width=80)
        with sub_c2:
            st.subheader(f"{home_team}")
            
        st.dataframe(style_dataframe(home_stats), use_container_width=True)


    # --- Player Statistics ---

    st.header("Player Statistics")

    away_passing, away_rushing, away_receiving = get_team_player_stats(game_data_filtered, away_team)
    home_passing, home_rushing, home_receiving = get_team_player_stats(game_data_filtered, home_team)

    p_col1, p_col2 = st.columns(2)

    with p_col1:
        st.subheader(f"{away_team} Players")
        if away_logo: st.image(away_logo, width=50)
        
        st.markdown("**Dropbacks**")
        st.dataframe(style_player_dataframe(away_passing), use_container_width=True)
        
        st.markdown("**Rush Attempts**")
        st.dataframe(style_player_dataframe(away_rushing), use_container_width=True)
        
        st.markdown("**Pass Targets**")
        st.dataframe(style_player_dataframe(away_receiving), use_container_width=True)

    with p_col2:
        st.subheader(f"{home_team} Players")
        if home_logo: st.image(home_logo, width=50)
        
        st.markdown("**Dropbacks**")
        st.dataframe(style_player_dataframe(home_passing), use_container_width=True)
        
        st.markdown("**Rush Attempts**")
        st.dataframe(style_player_dataframe(home_rushing), use_container_width=True)
        
        st.markdown("**Pass Targets**")
        st.dataframe(style_player_dataframe(home_receiving), use_container_width=True)

    # Optional: Play Log
    with st.expander("Raw Data Snippet"):
        st.dataframe(game_data_filtered[['posteam', 'down', 'ydstogo', 'desc', 'play_type', 'epa']].head(20))

def run_cli_mode(game_id):
    # Derive season from game_id (assuming format YYYY_WW_AWAY_HOME)
    try:
        season = int(game_id.split('_')[0])
    except (IndexError, ValueError):
        # Fallback or error
        print(json.dumps({"error": "Invalid game_id format. Expected YYYY_WW_AWAY_HOME."}))
        return

    try:
        # Parse teams directly from game_id (format: YYYY_WW_AWAY_HOME)
        parts = game_id.split('_')
        if len(parts) != 4:
            print(json.dumps({"error": f"Invalid game_id format: {game_id}"}))
            return
        away_team = parts[2]
        home_team = parts[3]

        with suppress_stdout():
            # Ensure PBP data is cached to disk for fast subsequent loads
            try:
                import appdirs
                cache_dir = os.path.join(
                    appdirs.user_cache_dir('nfl_data_py', 'nfl_data_py'),
                    'pbp', f'season={season}'
                )
                if not os.path.exists(cache_dir):
                    nfl.cache_pbp([season])
            except Exception:
                pass  # Non-fatal: will fall back to network download
            pbp_season = load_pbp_data(season, use_disk_cache=True)
            
        game_data_filtered = process_game_data(game_id, season, pbp_season)
        
        if game_data_filtered is None or game_data_filtered.empty:
             print(json.dumps({"error": "No play-by-play data found for this game."}))
             return

        # Calculate Stats
        home_stats = get_team_stats(game_data_filtered, home_team)
        away_stats = get_team_stats(game_data_filtered, away_team)
        
        home_passing, home_rushing, home_receiving = get_team_player_stats(game_data_filtered, home_team)
        away_passing, away_rushing, away_receiving = get_team_player_stats(game_data_filtered, away_team)

        # Construct JSON
        output = {
            "game_id": game_id,
            "season": season,
            "home_team": home_team,
            "away_team": away_team,
            "team_stats": {
                "home": home_stats.to_dict(),
                "away": away_stats.to_dict()
            },
            "player_stats": {
                "home": {
                    "passing": home_passing.to_dict(orient='records') if not home_passing.empty else [],
                    "rushing": home_rushing.to_dict(orient='records') if not home_rushing.empty else [],
                    "receiving": home_receiving.to_dict(orient='records') if not home_receiving.empty else []
                },
                "away": {
                    "passing": away_passing.to_dict(orient='records') if not away_passing.empty else [],
                    "rushing": away_rushing.to_dict(orient='records') if not away_rushing.empty else [],
                    "receiving": away_receiving.to_dict(orient='records') if not away_receiving.empty else []
                }
            }
        }
        
        # Replace NaN/Inf with None recursively before JSON serialization
        def sanitize(obj):
            if isinstance(obj, dict):
                return {k: sanitize(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [sanitize(v) for v in obj]
            if isinstance(obj, (float, np.floating)):
                if np.isnan(obj) or np.isinf(obj):
                    return None
                return float(obj)
            if isinstance(obj, np.integer):
                return int(obj)
            if isinstance(obj, np.ndarray):
                return sanitize(obj.tolist())
            return obj

        print(json.dumps(sanitize(output), indent=4))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if CLI_MODE:
        # Argument parsing
        parser = argparse.ArgumentParser(description="NFL Game Analysis CLI")
        parser.add_argument("--game_id", type=str, required=True, help="Game ID (e.g., 2023_01_DET_KC)")
        
        # If running via 'streamlit run', sys.argv might contain streamlit-specific flags.
        # But here we are in the explicit CLI_MODE block which attempts to exclude streamlit runs.
        # We only parse known args.
        args, unknown = parser.parse_known_args()
        
        run_cli_mode(args.game_id)
    else:
        run_streamlit_app()