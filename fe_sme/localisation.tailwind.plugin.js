const plugin = require('tailwindcss/plugin');

const locales = ['vi', 'en'];

/**
 * Create a tailwind plugin that generates variants for
 * each supported locale.
 *
 * Locale specific classNames can then be targeted:
 *
 *   `fr:px-4 jp:sm:px2`
 *
 */
function addTailwindLocalisations() {
    return plugin(function ({ addVariant }) {
        for (const locale of locales) {
            addVariant(locale, `.lang-${locale} &`);
        }
    });
}

module.exports = {
    localise: addTailwindLocalisations,
};
