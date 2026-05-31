INSERT INTO Source (source_Name)
VALUES ('X');

INSERT INTO NewsItem (source_ID, title, content_Text, event_Date, event_Time, category, latitude, longitude, has_Geotag, location_Text, location_Type)
VALUES

(1, 'Sharjah''s evening traffic - congestion worsens near City Centre', 'Heavy traffic congestion was reported near City Centre Sharjah during
 the evening rush hour, with commuters experiencing delays of up to 30 minutes on surrounding roads.', '2026-04-10', '18:30:00', 'Traffic',
 25.3463, 55.4209, 1, 'City Center Sharjah', 'inferred'),

(1, 'UAE weather alert - rain and dust expected this week', 'The National Centre of Meteorology has forecast scattered rain, strong winds, and
 blowing dust across parts of the UAE, which may affect road visibility and travel conditions.', '2026-04-20', '09:00:00', 'Weather', NULL, NULL, 1, 'UAE', 'inferred'),

(1, 'Business Bay sees growth in office occupancy rates', 'Business Bay has recorded an increase in office occupancy as more companies expand their operations in the area.',
'2026-04-18', '11:15:00', 'Economy', 25.1860, 55.2600, 1, 'Business Bay', 'inferred'),

(1, 'Sharjah Art Foundation hosts new contemporary exhibition', 'The Sharjah Art Foundation has launched a new contemporary art exhibition, attracting
 artists and visitors from across the region.', '2026-04-27', '17:00:00', 'Culture', 25.3575, 55.3880, 1, 'Sharjah Art Foundation', 'inferred'),

(1, 'Exhibition held at Dubai World Trade Centre attracts visitors', 'An international exhibition held at Dubai World Trade Centre (25.2250, 55.2830) attracted
professionals and visitors from across the region.', '2026-04-18', '11:00:00', 'Events', 25.2250, 55.2830, 1, 'Dubai World Trade Centre', 'explicit'),

(1, 'Community discussions grow around education reforms', 'Residents are actively discussing proposed changes in education systems and sharing feedback
 online.', '2026-04-17', '13:15:00', 'Education', NULL, NULL, 0, NULL, 'not_Geotaggable'),

(1, 'Al Majaz Amphitheatre announces upcoming live performances', 'Al Majaz Amphitheatre is set to host a series of live performances, drawing audiences from
 across Sharjah and nearby cities.', '2026-04-21', '18:30:00', 'Events', 25.3375, 55.3755, 1, 'Al Majaz Amphitheatre', 'inferred'),

(1, 'Expo Centre Sharjah hosts international trade exhibition', 'Expo Centre Sharjah (25.3260, 55.3780) is hosting an international trade exhibition featuring
 companies from multiple sectors.', '2026-04-18', '11:00:00', 'Business', 25.3260, 55.3780, 1, 'Expo Centre Sharjah', 'explicit'),

(1, 'Crowds gather near the lake-side promenade for evening activities', 'Residents and visitors gathered near the lake-side promenade for evening walks, dining,
 and family activities as footfall increased after sunset.', '2027-04-22', '18:50:00', 'Leisure', 25.3370, 55.3760, 1, 'Al Majaz', 'inferred'),

(1, 'Increased activity observed in older commercial district during evening hours', 'Shops and small businesses in an older commercial district remained active
 late into the evening, with narrow streets and traditional storefronts seeing steady foot traffic.', '2026-04-22', '19:30:00', 'Economy', 25.2697, 55.3095, 1,
 'Deira', 'inferred');


INSERT INTO MediaAttachment (news_ID, media_Type, media_URL)
VALUES
(1, 'image', 'https://d3jvxfsgjxj1vz.cloudfront.net/news/wp-content/uploads/2025/02/22202005/online-traffic-fine-payment-sharjah-1.webp'),
(2, 'image', 'https://img.etimg.com/thumb/msid-126069010,width-650,height-488,imgsize-30726,resizemode-75/dubai-weather-today.jpg'),
(2, 'video', 'https://www.youtube.com/embed/tapd02JABv0'),
(3, 'image', 'https://www.visitdubai.com/-/media/images/leisure/detail-pages/explore-dubai/1-3-dubai-neighbourhoods-t34/dubai-neighborhood-business-bay.jpg'),
(4, 'image', 'https://www.sharjahart.org/images/Thumbnail/School_of_Casablanca.jpg'),
(5, 'image', 'https://media.assettype.com/gulfnews%2F2026-01-28%2F4g1n89d1%2FDWTC-Horizontal.jpg?w=640&auto=format%2Ccompress&fit=max'),
(5, 'video', 'https://www.youtube.com/embed/VoHtqRNXu74'),
(6, 'image', 'https://mindingthecampus.org/wp-content/uploads/2025/06/Straight-Talk-About-Online-Classes.png'),
(7, 'image', 'https://comingsoon.ae/wp-content/uploads/2020/02/comingsoon.ae-al-majaz-amphitheatre-2024-12-28_19-37-43_758192.jpg'),
(7, 'image', 'https://cdn.emiratitimes.com/wp-content/uploads/2022/10/14173240/Sharjah-National-Park_Emirati-Times.jpg'),
(8, 'image', 'https://cdnx.premiumread.com/?url=https://www.gulftoday.ae/gulftoday/uploads/images/2026/04/05/1068237.webp&w=800&q=100&f=webp&t=0.0.2'),
(9, 'image', 'https://mindtrip.ai/cdn-cgi/image/format=webp,w=1200/https://images.mindtrip.ai/attractions/b665/5056/059a/998f/7822/4170/4da3/8d63'),
(10, 'image', 'https://www.dubai.it/en/wp-content/uploads/sites/142/deira-hd.jpg');