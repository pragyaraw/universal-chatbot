
CREATE TABLE IF NOT EXISTS industry_config (
                                               id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                                               industry_id     VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    system_prompt   TEXT NOT NULL,
    welcome_message VARCHAR(500) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT NOW()
    );


CREATE TABLE IF NOT EXISTS chat_logs (
                                         id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                                         session_id      VARCHAR(100) NOT NULL,
    user_id         VARCHAR(100),
    industry_id     VARCHAR(50) NOT NULL,
    channel         ENUM('web','sms','voice') DEFAULT 'web',
    user_message    TEXT NOT NULL,
    bot_reply       TEXT NOT NULL,
    sentiment_label VARCHAR(30),
    sentiment_score INT,
    escalated       BOOLEAN DEFAULT FALSE,
    response_ms     INT,
    created_at      DATETIME DEFAULT NOW(),
    INDEX idx_session   (session_id),
    INDEX idx_industry  (industry_id),
    INDEX idx_sentiment (sentiment_label),
    INDEX idx_created   (created_at)
    );

-- Seed industry data
INSERT IGNORE INTO industry_config (industry_id, name, system_prompt, welcome_message) VALUES
('telecom',     'Telecom Support',    'You are a telecom assistant. Help with balance, recharge, SIM, outages.',              'Hello! How can I help with your telecom services?'),
('banking',     'Banking Assistant',  'You are a banking assistant. Help with accounts, loans, cards, transfers.',             'Welcome! How may I assist with your banking needs?'),
('realestate',  'Real Estate',        'You are a real estate assistant in India. Help with properties, EMI, loans.',           'Welcome! Looking to buy, sell or rent? I am here to help!'),
('healthcare',  'Healthcare',         'You are a healthcare assistant. Help with appointments, health info, insurance.',        'Hello! How can I assist with your healthcare queries?');