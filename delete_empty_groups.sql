-- Function to check and delete empty groups
CREATE OR REPLACE FUNCTION public.delete_empty_groups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete groups that have no members
  DELETE FROM public.groups
  WHERE id IN (
    SELECT g.id 
    FROM public.groups g
    LEFT JOIN public.profiles p ON p.group_id = g.id
    GROUP BY g.id
    HAVING COUNT(p.id) = 0
  );
  
  RETURN NULL;
END;
$$;

-- Trigger that runs after updates or deletes on profiles table
DROP TRIGGER IF EXISTS trigger_delete_empty_groups ON public.profiles;
CREATE TRIGGER trigger_delete_empty_groups
  AFTER UPDATE OR DELETE
  ON public.profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.delete_empty_groups(); 