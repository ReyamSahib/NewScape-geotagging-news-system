CREATE DATABASE NewsStore;
USE NewsStore;

CREATE TABLE Source (
    source_ID INT AUTO_INCREMENT PRIMARY KEY,
    source_Name VARCHAR(100)
);

CREATE TABLE NewsItem (
    news_ID INT AUTO_INCREMENT PRIMARY KEY,
    source_ID INT,
    title VARCHAR(100),
    content_Text TEXT,
    event_Date DATE,
    event_Time TIME,
    category VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    has_Geotag BOOLEAN,
    location_Text VARCHAR(255),
    location_Type VARCHAR(50),
    FOREIGN KEY (source_ID) REFERENCES Source(source_ID)
);

CREATE TABLE MediaAttachment(
    media_ID INT AUTO_INCREMENT PRIMARY KEY,
    news_ID INT,
    media_Type VARCHAR(50),
    media_URL VARCHAR(255),
    FOREIGN KEY (news_ID) REFERENCES NewsItem(news_ID)
);

CREATE TABLE RegisteredUser(
    user_ID INT PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(50)
);