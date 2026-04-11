import rss, { pagesGlobToRssItems } from '@astrojs/rss';

export async function GET(context) {
    return rss({
        title: 'Web Development and Technology Blog | Yassine Samlali',
        description: 'Welcome to my blog, where I share insights about frontend development, teaching, and modern web technologies.',
        site: context.site,
        items: await pagesGlobToRssItems(
            import.meta.glob('./**/*.md')),
        customData: `<language>es</language>`,
    });
}