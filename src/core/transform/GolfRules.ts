export interface GolfRules {
  deadCodeElimination: boolean;
  declarationMerging: boolean;
  loopGolfing: boolean;
  ternaryGolfing: boolean;
  nativeCallGolfing: boolean;
  variableRenaming: boolean;
  operatorSimplification: boolean;
}

export const defaultGolfRules: GolfRules = {
  deadCodeElimination: true,
  declarationMerging: true,
  loopGolfing: true,
  ternaryGolfing: true,
  nativeCallGolfing: true,
  variableRenaming: true,
  operatorSimplification: true
};

export interface GolfRuleDescriptor {
  key: keyof GolfRules;
  label: string;
}

export const golfRuleDescriptors: GolfRuleDescriptor[] = [
  { key: "deadCodeElimination", label: "Dead code elimination" },
  { key: "declarationMerging", label: "Declaration merging" },
  { key: "loopGolfing", label: "Loop golfing" },
  { key: "ternaryGolfing", label: "Ternary conditionals" },
  { key: "nativeCallGolfing", label: "Native call shortcuts" },
  { key: "variableRenaming", label: "Variable renaming" },
  { key: "operatorSimplification", label: "Operator simplification" }
];
