-- Disable RLS temporarily to fix the issue
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Re-enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies
CREATE POLICY "notifications_select_policy" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_policy" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_policy" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Allow all authenticated users to insert notifications
CREATE POLICY "notifications_insert_policy" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
