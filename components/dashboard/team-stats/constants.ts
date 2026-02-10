import type { AdvancedTeamStats } from "@/services/matchupService";

export type StatRowConfig = {
  label: string;
  offKey: keyof AdvancedTeamStats;
  defKey?: keyof AdvancedTeamStats;
  leagueContextOffKey: string;
  leagueContextDefKey?: string;
  tooltip?: string;
};

export type StatSectionConfig = {
  title: string;
  iconName: "Target" | "BarChart3" | "Zap" | "Crosshair";
  rows: StatRowConfig[];
};

export const STAT_SECTIONS: StatSectionConfig[] = [
  {
    title: "Scoring",
    iconName: "Target",
    rows: [
      {
        label: "Points",
        offKey: "pointsFor",
        defKey: "pointsAgainst",
        leagueContextOffKey: "pointsFor",
        leagueContextDefKey: "pointsAgainst",
      },
      {
        label: "Point Diff",
        offKey: "diff",
        leagueContextOffKey: "diff",
      },
    ],
  },
  {
    title: "Production",
    iconName: "BarChart3",
    rows: [
      {
        label: "Total YPG",
        offKey: "offTotalYPG",
        defKey: "defTotalYPG",
        leagueContextOffKey: "offTotalYPG",
        leagueContextDefKey: "defTotalYPG",
      },
      {
        label: "Pass YPG",
        offKey: "offPassYPG",
        defKey: "defPassYPG",
        leagueContextOffKey: "offPassYPG",
        leagueContextDefKey: "defPassYPG",
      },
      {
        label: "Rush YPG",
        offKey: "offRushYPG",
        defKey: "defRushYPG",
        leagueContextOffKey: "offRushYPG",
        leagueContextDefKey: "defRushYPG",
      },
    ],
  },
  {
    title: "Efficiency",
    iconName: "Zap",
    rows: [
      {
        label: "EPA / Play",
        offKey: "offEpa",
        defKey: "defEpa",
        leagueContextOffKey: "offEpa",
        leagueContextDefKey: "defEpa",
      },
      {
        label: "Success Rate",
        offKey: "offSuccess",
        defKey: "defSuccess",
        leagueContextOffKey: "offSuccess",
        leagueContextDefKey: "defSuccess",
      },
      {
        label: "Pass EPA",
        offKey: "offPassEpa",
        defKey: "defPassEpa",
        leagueContextOffKey: "offPassEpa",
        leagueContextDefKey: "defPassEpa",
      },
      {
        label: "Pass Success",
        offKey: "offPassSuccess",
        defKey: "defPassSuccess",
        leagueContextOffKey: "offPassSuccess",
        leagueContextDefKey: "defPassSuccess",
      },
      {
        label: "Rush EPA",
        offKey: "offRushEpa",
        defKey: "defRushEpa",
        leagueContextOffKey: "offRushEpa",
        leagueContextDefKey: "defRushEpa",
      },
      {
        label: "Rush Success",
        offKey: "offRushSuccess",
        defKey: "defRushSuccess",
        leagueContextOffKey: "offRushSuccess",
        leagueContextDefKey: "defRushSuccess",
      },
    ],
  },
  {
    title: "Situational",
    iconName: "Crosshair",
    rows: [
      {
        label: "3rd Down Conv",
        offKey: "off3rdDownConv",
        defKey: "def3rdDownConv",
        leagueContextOffKey: "off3rdDownConv",
        leagueContextDefKey: "def3rdDownConv",
        tooltip: "Overall 3rd down conversion rate.",
      },
      {
        label: "3rd & Short",
        offKey: "off3rdShortConv",
        defKey: "def3rdShortConv",
        leagueContextOffKey: "off3rdShortConv",
        leagueContextDefKey: "def3rdShortConv",
        tooltip: "Conversion rate on 3rd down with 3 or fewer yards to go.",
      },
      {
        label: "3rd & Medium",
        offKey: "off3rdMedConv",
        defKey: "def3rdMedConv",
        leagueContextOffKey: "off3rdMedConv",
        leagueContextDefKey: "def3rdMedConv",
        tooltip: "Conversion rate on 3rd down with 4-6 yards to go.",
      },
      {
        label: "3rd & Long",
        offKey: "off3rdLongConv",
        defKey: "def3rdLongConv",
        leagueContextOffKey: "off3rdLongConv",
        leagueContextDefKey: "def3rdLongConv",
        tooltip: "Conversion rate on 3rd down with 7+ yards to go.",
      },
      {
        label: "4th Down",
        offKey: "off4thDownSuccess",
        defKey: "def4thDownSuccess",
        leagueContextOffKey: "off4thDownSuccess",
        leagueContextDefKey: "def4thDownSuccess",
        tooltip: "Success rate on 4th down go-for-it attempts.",
      },
      {
        label: "Red Zone TD%",
        offKey: "offRedzoneTD",
        defKey: "defRedzoneTD",
        leagueContextOffKey: "offRedzoneTD",
        leagueContextDefKey: "defRedzoneTD",
        tooltip: "TD rate on plays inside the opponent's 20-yard line.",
      },
      {
        label: "Goal-to-Go TD%",
        offKey: "offGoalLineTD",
        defKey: "defGoalLineTD",
        leagueContextOffKey: "offGoalLineTD",
        leagueContextDefKey: "defGoalLineTD",
        tooltip: "TD rate on plays inside the opponent's 10-yard line.",
      },
      {
        label: "2-Min Drill EPA",
        offKey: "offTwoMinEpa",
        defKey: "defTwoMinEpa",
        leagueContextOffKey: "offTwoMinEpa",
        leagueContextDefKey: "defTwoMinEpa",
        tooltip: "EPA per play in the final 2 minutes of each half.",
      },
      {
        label: "Clutch EPA",
        offKey: "offClutchEpa",
        defKey: "defClutchEpa",
        leagueContextOffKey: "offClutchEpa",
        leagueContextDefKey: "defClutchEpa",
        tooltip:
          "EPA per play when WP is 30-70% in the final 4 minutes of Q4 or overtime.",
      },
    ],
  },
];
