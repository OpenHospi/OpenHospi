import config from "@openhospi/eslint-config/react";
import { globalIgnores } from "eslint/config";

export default [...config, globalIgnores([".react-email/**"])];
