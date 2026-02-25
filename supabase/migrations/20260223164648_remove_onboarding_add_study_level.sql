-- Replace study_year (free text integer) with study_level enum
-- Enum values match @openhospi/shared/enums STUDY_LEVELS
CREATE TYPE study_level_enum AS ENUM (
  'mbo', 'hbo_propedeuse', 'hbo_bachelor',
  'wo_propedeuse', 'wo_bachelor', 'pre_master', 'master', 'phd'
);

ALTER TABLE profiles DROP COLUMN study_year;
ALTER TABLE profiles ADD COLUMN study_level study_level_enum;
