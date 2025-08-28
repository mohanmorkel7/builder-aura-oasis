-- Fix FinOps SLA Notifications - Add missing start_time column and fix function

-- Step 1: Add the missing start_time column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finops_subtasks' 
        AND column_name = 'start_time'
    ) THEN
        ALTER TABLE finops_subtasks ADD COLUMN start_time TIME DEFAULT '05:00:00';
        COMMENT ON COLUMN finops_subtasks.start_time IS 'Daily start time for the subtask';
    END IF;
END $$;

-- Step 2: Add auto_notify column if it doesn't exist  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'finops_subtasks' 
        AND column_name = 'auto_notify'
    ) THEN
        ALTER TABLE finops_subtasks ADD COLUMN auto_notify BOOLEAN DEFAULT true;
        COMMENT ON COLUMN finops_subtasks.auto_notify IS 'Enable/disable automatic SLA notifications for this subtask';
    END IF;
END $$;

-- Step 3: Create or replace the SLA notification function with proper time arithmetic
CREATE OR REPLACE FUNCTION check_subtask_sla_notifications()
RETURNS TABLE(
  notification_type TEXT,
  subtask_id INTEGER,
  task_id INTEGER,
  task_name TEXT,
  subtask_name TEXT,
  assigned_to TEXT,
  time_diff_minutes INTEGER,
  message TEXT
) AS $$
DECLARE
  current_time_only TIME := CURRENT_TIME::TIME;
  current_date_only DATE := CURRENT_DATE;
  current_timestamp_val TIMESTAMP := NOW();
BEGIN
  -- Check for SLA warnings (15 minutes before start_time)
  RETURN QUERY
  SELECT
    'sla_warning'::TEXT as notification_type,
    fs.id as subtask_id,
    fs.task_id,
    ft.task_name,
    fs.name as subtask_name,
    COALESCE(fs.assigned_to, ft.assigned_to) as assigned_to,
    -- Calculate time difference properly by converting to timestamps
    EXTRACT(EPOCH FROM (
      (current_date_only + fs.start_time) - current_timestamp_val
    ))::INTEGER / 60 as time_diff_minutes,
    format('SLA Warning - %s min remaining • need to start',
           ROUND(EXTRACT(EPOCH FROM (
             (current_date_only + fs.start_time) - current_timestamp_val
           )) / 60)) as message
  FROM finops_subtasks fs
  LEFT JOIN finops_tasks ft ON fs.task_id = ft.id
  WHERE fs.start_time IS NOT NULL
  AND fs.auto_notify = true
  AND fs.status IN ('pending', 'in_progress')
  AND ft.is_active = true
  -- Check if start_time is within next 15 minutes
  AND (current_date_only + fs.start_time) > current_timestamp_val
  AND (current_date_only + fs.start_time) <= current_timestamp_val + INTERVAL '15 minutes'
  -- Prevent duplicate notifications
  AND NOT EXISTS (
    SELECT 1 FROM finops_activity_log fal
    WHERE fal.task_id = fs.task_id
    AND fal.subtask_id = fs.id
    AND fal.action = 'sla_alert'
    AND fal.timestamp > current_timestamp_val - INTERVAL '1 hour'
  );

  -- Check for overdue notifications (15+ minutes after start_time)
  RETURN QUERY
  SELECT
    'sla_overdue'::TEXT as notification_type,
    fs.id as subtask_id,
    fs.task_id,
    ft.task_name,
    fs.name as subtask_name,
    COALESCE(fs.assigned_to, ft.assigned_to) as assigned_to,
    -- Calculate time difference properly by converting to timestamps
    EXTRACT(EPOCH FROM (
      current_timestamp_val - (current_date_only + fs.start_time)
    ))::INTEGER / 60 as time_diff_minutes,
    format('Overdue by %s min • started %s min ago',
           ROUND(EXTRACT(EPOCH FROM (
             current_timestamp_val - (current_date_only + fs.start_time)
           )) / 60),
           ROUND(EXTRACT(EPOCH FROM (
             current_timestamp_val - (current_date_only + fs.start_time)
           )) / 60)) as message
  FROM finops_subtasks fs
  LEFT JOIN finops_tasks ft ON fs.task_id = ft.id
  WHERE fs.start_time IS NOT NULL
  AND fs.auto_notify = true
  AND fs.status IN ('pending', 'in_progress')
  AND ft.is_active = true
  -- Check if start_time was more than 15 minutes ago
  AND (current_date_only + fs.start_time) < current_timestamp_val - INTERVAL '15 minutes'
  -- Prevent duplicate notifications
  AND NOT EXISTS (
    SELECT 1 FROM finops_activity_log fal
    WHERE fal.task_id = fs.task_id
    AND fal.subtask_id = fs.id
    AND fal.action = 'overdue_notification_sent'
    AND fal.timestamp > current_timestamp_val - INTERVAL '1 hour'
  );
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update existing subtasks to have default start_time and auto_notify values
UPDATE finops_subtasks 
SET 
  start_time = '05:00:00'
WHERE start_time IS NULL;

UPDATE finops_subtasks 
SET 
  auto_notify = true
WHERE auto_notify IS NULL;

-- Step 5: Create index for performance on start_time and auto_notify
CREATE INDEX IF NOT EXISTS idx_finops_subtasks_start_time ON finops_subtasks(start_time);
CREATE INDEX IF NOT EXISTS idx_finops_subtasks_auto_notify ON finops_subtasks(auto_notify);

-- Step 6: Test the function (this will show any remaining issues)
SELECT 
  'Testing function...' as status,
  COUNT(*) as notification_count
FROM check_subtask_sla_notifications();
