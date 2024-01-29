<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/></title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="stylesheet" href="/assets/main.css"/>
      </head>
      <body class="rss">
        <header>
          <img src="/assets/favicon.svg" alt="" width="128" height="128"/>
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <h2>RSS Feed</h2>
          <p>Subscribe to this RSS feed by copying the URL into your RSS reader.</p>
          <p><code><xsl:value-of select="/rss/channel/link"/>/rss.xml</code></p>
        </header>
        <main>
          <xsl:for-each select="/rss/channel/item">
            <article>
              <h3>
                <a rel="noopener noreferrer" target="_blank">
                  <xsl:attribute name="href">
                    <xsl:value-of select="link"/>
                  </xsl:attribute>
                  <span>
                    <xsl:value-of select="title"/>
                  </span>
                </a>
              </h3>
              <blockquote>
                <p><xsl:value-of select="description"/></p>
              </blockquote>
            </article>
          </xsl:for-each>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
