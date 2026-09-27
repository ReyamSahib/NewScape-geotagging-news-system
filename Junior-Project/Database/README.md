## Database
The project includes a conceptual database design and SQL schema covering entities such as NewsItem, Source, MediaAttachment, and User.
For further information,

    .Source: The origin of a news item; where it was taken from ( X, GulfNews, etc. )
    .NewsItem: Main entity, The news data / product which contains important information such as title, content, etc.
    .MediaAttachment: The associated media to each news item including images, links, and videos.
    .RegisteredUser: Registered user whose information is saved within the NewsStore database.

Multiple NewsItem's can come from a single source, multiple MediaAttachment's can come from each NewsItem, RegisteredUser is an independent entity because it has no direct relationship with the NewsItem and does not directly affect the database design.
Related to the Entity-Relationship diagram^