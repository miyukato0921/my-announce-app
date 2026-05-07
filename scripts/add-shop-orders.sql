-- productsテーブルに発送要否フラグを追加
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN DEFAULT TRUE;

-- shop_ordersテーブルを新規作成（ショップ注文管理用）
CREATE TABLE IF NOT EXISTS shop_orders (
  id SERIAL PRIMARY KEY,
  stripe_session_id VARCHAR(255) UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price INTEGER NOT NULL,
  buyer_name VARCHAR(255),
  buyer_email VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending',
  requires_shipping BOOLEAN DEFAULT TRUE,
  shipping_name VARCHAR(255),
  shipping_postal_code VARCHAR(20),
  shipping_address TEXT,
  shipping_phone VARCHAR(50),
  shipping_status VARCHAR(50) DEFAULT 'not_required',
  shipped_at TIMESTAMP WITH TIME ZONE,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
