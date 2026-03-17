/**
 * Scaling <iframe>-elements.
 *
 * Original script by Emanuel Kluge
 * Fix: Two-axis scaling so 4K layouts preview correctly
 * without the black band at the bottom.
 */
(function (win, doc) {

  /**
   * Throttle resize events
   */
  var THROTTLE = 30;

  /** Original variable kept */
  var IFRAME_HEIGHT;

  var iframe = doc.getElementsByTagName('iframe')[0],
      timestamp = 0;

  /** Breakpoint where scaling starts */
  var BREAKPOINT = 1919;

  if (iframe.hasAttribute('data-breakpoint'))
    BREAKPOINT = iframe.getAttribute('data-breakpoint');

  /**
   * Original behavior used the iframe's computed height.
   */
  IFRAME_HEIGHT = parseInt(getComputedStyle(iframe).height, 10);
  
  var NATIVE_WIDTH  = 0;
	var NATIVE_HEIGHT = 0;

	iframe.addEventListener('load', function() {
	  // Try data attributes first
	  if (iframe.hasAttribute('data-native-width') && iframe.hasAttribute('data-native-height')) {
		NATIVE_WIDTH  = parseInt(iframe.getAttribute('data-native-width'),  10);
		NATIVE_HEIGHT = parseInt(iframe.getAttribute('data-native-height'), 10);
	  } else {
		// If no attributes, rely on the orientation defaults previously set
		// or offsetWidth/Height if they were somehow explicitly sized
		var currentOrientation = iframe.getAttribute('data-orientation') || 'landscape';
		var defW = currentOrientation === 'portrait' ? 1080 : 1920;
		var defH = currentOrientation === 'portrait' ? 1920 : 1080;
		
		// Fallback to our orientation defaults
		NATIVE_WIDTH  = iframe.offsetWidth || defW;
		NATIVE_HEIGHT = iframe.offsetHeight || defH;
	  }
	  onResize();
	});


  /**
   * ADDED:
   * Read the native resolution of the layout.
   * This allows proper 16:9 or 9:16 scaling for things like
   * 1920x1080, 1080x1920, or 3840x2160 layouts.
   */
  var orientation = iframe.getAttribute('data-orientation') || 'landscape';
  var defaultWidth = orientation === 'portrait' ? 1080 : 1920;
  var defaultHeight = orientation === 'portrait' ? 1920 : 1080;

  NATIVE_WIDTH  = parseInt(iframe.getAttribute('data-native-width')  || defaultWidth, 10);
  NATIVE_HEIGHT = parseInt(iframe.getAttribute('data-native-height') || defaultHeight, 10);


  /**
   * Generates cross-browser transform string
   */
  function transformStr(obj) {
    var obj = obj || {},
        val = '',
        j;

    for (j in obj) {
      val += j + '(' + obj[j] + ') ';
    }

    val += 'translateZ(0)';

    return '-webkit-transform: ' + val + '; ' +
           '-moz-transform: ' + val + '; ' +
           'transform: ' + val;
  }


  /**
   * Resize logic
   */
  function onResize() {

    var now = +new Date,
        container = iframe.parentElement,
        winWidth  = container.clientWidth || win.innerWidth,
        winHeight = container.clientHeight || win.innerHeight,

        noResizing = winWidth > BREAKPOINT,

        scale,
        width,
        height,
        offsetLeft,
        offsetTop;

    if (now - timestamp < THROTTLE || noResizing) {

      /** Remove scaling if we're outside the breakpoint */
      noResizing && iframe.hasAttribute('style') && iframe.removeAttribute('style');

      return onResize;
    }

    timestamp = now;


    /**
     * ORIGINAL PROBLEM
     * ----------------
     * The old code only calculated scale from WIDTH.
     * This causes the "black band at the bottom"
     * mentioned in the transcript.
     *
     * OLD:
     * scale = Math.pow(winWidth / BREAKPOINT, 1);
     */


    /**
     * FIX
     * ---
     * Calculate scaling for BOTH axes.
     * Use the smaller scale so the layout always fits.
     *
     * This preserves the aspect ratio (16:9 for most signage layouts).
     */
    var scaleX = winWidth  / NATIVE_WIDTH;
    var scaleY = winHeight / NATIVE_HEIGHT;

    scale = Math.min(scaleX, scaleY);


    /**
     * Original code used percentage width compensation.
     * We keep similar behavior but use native resolution
     * so 4K or 1080 layouts scale correctly.
     */
    width  = NATIVE_WIDTH  * scale;
    height = NATIVE_HEIGHT * scale;


    /**
     * Center iframe horizontally
     * (same idea as original translateX)
     */
    offsetLeft = (winWidth - width) / 2;


    /**
     * ADDED:
     * Vertical centering so the layout doesn't sit at the top
     * leaving a large black band at the bottom.
     */
    offsetTop = (winHeight - height) / 2;


    /**
     * Apply styles
     *
     * We keep the original transform system,
     * but now apply offsets for both axes.
     */
    iframe.setAttribute(
      'style',
      'width: ' + NATIVE_WIDTH + 'px; ' +
      'height: ' + NATIVE_HEIGHT + 'px; ' +
      'transform-origin: 0 0; ' +
      '-webkit-transform-origin: 0 0; ' +
      transformStr({ scale: scale }) + '; ' +
      'margin-left: ' + offsetLeft + 'px; ' +
      'margin-top: '  + offsetTop  + 'px; '
    );

    return onResize;

  }

  /** Attach resize listener */
  win.addEventListener('resize', onResize(), false);

  onResize();

})(window.self, document);