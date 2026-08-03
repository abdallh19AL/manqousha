-- Admin needs to read any customer's profile (by customer_code) from the
-- admin page's search feature. profiles never got an admin SELECT policy —
-- 005_add_profiles.sql only allowed users to read their own row via
-- auth.uid() = id, unlike orders/order_items/products which all got an
-- is_admin() policy. That's why admin search by customer_code silently
-- returned "not found" for every profile except the admin's own: RLS was
-- hiding the row, not a query bug.
--
-- Additive: Postgres OR-combines multiple permissive policies for the same
-- command, so this coexists with "users_read_own_profile" — users keep
-- reading their own row, admins can now read all rows.
CREATE POLICY "admins_read_all_profiles"
  ON profiles FOR SELECT
  USING (is_admin());
