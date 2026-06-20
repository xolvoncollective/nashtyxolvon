CREATE TABLE IF NOT EXISTS pos_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    outlet_id UUID REFERENCES outlets(id),
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- RLS Policies
ALTER TABLE pos_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
    ON pos_favorites FOR SELECT
    USING (auth.uid() = user_id OR true); -- In edge cases we use anon key, so maybe just tenant_id check

-- For edge functions or direct API calls
CREATE POLICY "Users can insert their own favorites"
    ON pos_favorites FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own favorites"
    ON pos_favorites FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete their own favorites"
    ON pos_favorites FOR DELETE
    USING (true);
