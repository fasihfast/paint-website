const mysql=require('mysql2');

const db = mysql.createPool({
    host: "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

db.on('connected',()=>{
    console.log("Database Connected");
})

db.on('Disconnected',()=>{
    console.log("Database Disconnected");
})

db.on('Error',()=>{
    console.log("Error has occured while connecting to Database");
})

const create_table_query=`
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_users_email (email),
    deleted_at TIMESTAMP NULL  -- Soft delete
);

-- Categories Table
CREATE TABLE IF NOT EXISTS Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id INT,
    deleted_at TIMESTAMP NULL,  -- Soft delete
    FOREIGN KEY (parent_category_id) REFERENCES Categories(category_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Brands Table
CREATE TABLE IF NOT EXISTS Brands (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    description TEXT,
    deleted_at TIMESTAMP NULL  -- Soft delete
);

-- Products Table (for all types of products)
CREATE TABLE IF NOT EXISTS Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category_id INT,
    brand_id INT,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,  -- Soft delete
    INDEX idx_products_category (category_id),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (brand_id) REFERENCES Brands(brand_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Product Variants Table (for different product types)
CREATE TABLE IF NOT EXISTS ProductVariants (
    variant_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    size VARCHAR(50),  -- Size can vary per product type
    color VARCHAR(50),  -- Color can vary per product type
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL,
    INDEX idx_product_variants_product (product_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Orders Table
CREATE TABLE IF NOT EXISTS Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    gross_amount DECIMAL(10, 2) NOT NULL,
    shipping_amount DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) NOT NULL,
    order_status ENUM('placed', 'processing', 'shipping', 'delivered') NOT NULL,
    payment_status ENUM('paid', 'not paid') NOT NULL,
    payment_type ENUM('netbanking', 'upi', 'cod') NOT NULL,
    payment_transaction_id VARCHAR(100),
    shipping_address_id INT,
    payment_id INT,
    INDEX idx_orders_user (user_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (shipping_address_id) REFERENCES ShippingAddresses(address_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_payment_key FOREIGN KEY (payment_id) REFERENCES Payments(payment_id) ON DELETE SET NULL ON UPDATE CASCADE
    );

-- Order Items Table
CREATE TABLE IF NOT EXISTS OrderItems (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    variant_id INT,  -- Referring to Product Variants
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_amount DECIMAL(10, 2) NOT NULL,
    INDEX idx_order_items_order (order_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES ProductVariants(variant_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Payments Table
CREATE TABLE IF NOT EXISTS Payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    payment_method VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE ON UPDATE CASCADE
);




-- Shipping Addresses Table
CREATE TABLE IF NOT EXISTS ShippingAddresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Shopping Cart Table
CREATE TABLE IF NOT EXISTS CartItems (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    variant_id INT,
    quantity INT NOT NULL CHECK (quantity > 0),
    INDEX idx_cart_items_variant (variant_id),
    FOREIGN KEY (variant_id) REFERENCES ProductVariants(variant_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS Reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    user_id INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reviews_product (product_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS Wishlist (
    wishlist_item_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    variant_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES ProductVariants(variant_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Offers Table
CREATE TABLE IF NOT EXISTS Offers (
    offer_id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('fixed', 'rate') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active'
);

-- Product Images Table
CREATE TABLE IF NOT EXISTS ProductImages (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Analytics Table
CREATE TABLE IF NOT EXISTS Analytics (
    analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    variant_id INT,
    view_count INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_analytics_user (user_id),
    INDEX idx_analytics_variant (variant_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES ProductVariants(variant_id) ON DELETE CASCADE ON UPDATE CASCADE
);
`;


db.query(create_table_query,(err,result)=>{

    if(err){
        console.error("Error has occured while running the query: ", err.message);
    }else{
        console.log("Table created successfully : ",result);
    }

});

module.exports=db;
