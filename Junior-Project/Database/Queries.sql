SELECT * FROM NewsItem;

SELECT title, category FROM NewsItem;

SELECT * FROM NewsItem WHERE location_Type = 'inferred';

SELECT n.title, s.source_Name
FROM NewsItem n
JOIN Source s ON n.source_ID = s.source_ID;

SELECT * FROM MediaAttachment;

SELECT n.title, n.category, m.media_Type, m.media_URL
FROM NewsItem n
JOIN MediaAttachment m ON n.news_ID = m.news_ID;

SELECT n.title, m.media_URL
FROM NewsItem n
JOIN MediaAttachment m ON n.news_ID = m.news_ID;

SELECT news_ID, COUNT(*)
FROM MediaAttachment
GROUP BY news_ID;

SELECT COUNT(*)
FROM NewsItem
WHERE TIMESTAMP(event_Date, event_Time) >= NOW() - INTERVAL 1 DAY;

SELECT *
FROM NewsItem
WHERE event_Date BETWEEN '2026-04-20' AND '2026-04-25'