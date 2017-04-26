'use strict';

const _ = require('lodash');
const VERSION = require('./constants').VERSION;

const DEFAULTS = {
  dependencies: {
    'global': '^4.3.2',
    'video.js': '^5.16.0'
  },
  devDependencies: {
    'videojs-spellbook': '^4.0.0'
  }
};

/**
 * Takes advantage of the way V8 orders object properties - by their
 * assignment order - to "sort" an object in alphabetic order.
 *
 * @param  {Object} source
 * @return {Object}
 *         A new ordered object.
 */
const alphabetizeObject = (source) =>
  _.pick(source, Object.keys(source).sort());

/**
 * Identical to `alphabetizeObject`, but there is special handling to
 * preserve the ordering of "pre" and "post" scripts next to their
 * core scripts. For example:
 *
 *    "preversion": "...",
 *    "version": "...",
 *    "postversion": "..."
 *
 * @param  {Object} source
 * @return {Object}
 *         A new ordered object.
 */
const alphabetizeScripts = (source) => {
  const keys = Object.keys(source);
  const prePost = keys.filter(
    k => _.startsWith(k, 'pre') || _.startsWith(k, 'post')
  );
  const order = _.difference(keys, prePost).sort();

  // Inject the pre/post scripts into the order where they belong.
  prePost.forEach(pp => {
    const isPre = _.startsWith(pp, 'pre');
    const i = order.indexOf(pp.substr(isPre ? 3 : 4));

    // Insert pre-scripts in place of their related core script and
    // post-scripts after their related core script.
    if (i > -1) {
      order.splice(isPre ? i : i + 1, 0, pp);

    // If this is a pre/post script with no related core script, just
    // stick it on the end. This is an unlikely case, though.
    } else {
      order.push(pp);
    }
  });

  return _.pick(source, order);
};

/**
 * Create a package.json based on options.
 *
 * @param  {Object} current
 *         Representation of current package.json.
 * @param  {Object} context
 *         Generator rendering context.
 * @return {Object}
 */
module.exports = (current, context) => {
  current = current || {};

  const result = _.assign({}, current, {
    'name': context.packageName,
    'version': context.version,
    'description': context.description,
    'main': 'build/es5/index.js',
    'jsnext:main': 'src/js/index.js',

    'engines': {
      node: '>=4.4.0'
    },

    'generator-videojs-plugin': {
      version: VERSION
    },

    'scripts': _.assign({}, current.scripts, {
      clean: 'sb-clean',
      build: 'sb-build',
      lint: 'sb-lint',
      prepublish: 'npm run build',
      start: 'sb-start',
      watch: 'sb-watch',
      test: 'sb-test',
      postversion: 'sb-release'
    }),

    // Always include the two minimum keywords with whatever exists in the
    // current keywords array.
    'keywords': _.union(['videojs', 'videojs-plugin'], current.keywords).sort(),
    'author': context.author,
    'license': context.licenseName,

    'spellbook': {},

    'files': [
      'CONTRIBUTING.md',
      'CHANGELOG.md',
      'README.md',
      'build/docs',
      'dist/',
      'build/es5',
      'index.html',
      'src/',
      'docs/'
    ],

    'dependencies': _.assign({}, current.dependencies, DEFAULTS.dependencies),

    'devDependencies': _.assign(
      {},
      current.devDependencies,
      DEFAULTS.devDependencies
    )
  });

  // spellbook mappings
  ['js', 'css', 'lang', 'docs', 'test'].forEach(function(prop) {
    if (context[prop] === false) {
      result.spellbook[prop] = false;
    } else if (current && current.spellbook && current.spellbook[prop]) {
      result.spellbook[prop] = current.spellbook[prop];
    }
  });

  // In case husky was previously installed, but is now "none", we can
  // remove it from the package.json entirely.
  if (context.husky === 'none') {
    delete result.devDependencies.husky;
    delete result.scripts.prepush;
  } else {
    result.devDependencies.husky = '^0.13.1';
    result.scripts.prepush = `npm run ${context.husky}`;
  }

  // Delete old config that was used for ghooks.
  delete result.devDependencies.ghooks;
  if (result.config) {
    delete result.config.ghooks;
    if (Object.keys(result.config).length === 0) {
      delete result.config;
    }
  }

  if (context.type !== 'basic') {
    result.dependencies['video.js'] = '^6.0.1';
  }

  result.files.sort();
  result.scripts = alphabetizeScripts(result.scripts);
  result.dependencies = alphabetizeObject(result.dependencies);
  result.devDependencies = alphabetizeObject(result.devDependencies);

  return result;
};
