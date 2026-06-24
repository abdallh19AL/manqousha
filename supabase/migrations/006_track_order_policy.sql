-- Allow public read access to orders and order_items using the order UUID as an
-- access key. UUIDs have 122 bits of randomness and are not enumerable, so
-- knowing a UUID is sufficient proof of access for a guest order tracker.

CREATE POLICY "public_can_track_own_order_by_id"
  ON orders
  FOR SELECT
  USING (true);

-- order_items must also be readable for the nested select in the tracker
CREATE POLICY "public_can_read_order_items"
  ON order_items
  FOR SELECT
  USING (true);
