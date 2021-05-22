[Return to Documentation Index](/docs/README.md)

# Helper Functions

  * [appstyle.getMousePos(win)](docs/helper-functions.md#get-mouse-pos) - return an object containing mouse x and y coordinates. if you pass it a window, it will return local window coordinates.
  * [appstyle.getLocalPos(win, x, y)](docs/helper-functions.md#get-local-pos) - convert a canvas x, y coordinate into a local window coordinate.
  * [appstyle.getWidgetById(win, widgetId)](docs/helper-functions.md#get-widget-by-id) - returns the widget object from the current frame's data.
  * [appstyle.getWidgetPos(win, widget, absolute)](docs/helper-functions.md#get-widget-pos) - if absolute is `true`, returns the position of the widget object within the window, if `false`, returns the position of a nested widget object relative to its parent widget.
  * [appstyle.getCharPos(win, x, y)](docs/helper-functions.md#get-char-pos) - convert a character coordinate into a pixel coordinate
  * [appstyle.getCharFromPos(win, x, y, truncate)](docs/helper-functions.md#get-char-from-pos.md) - convert a pixel coordinate into a character coordinate. if `truncate` is true, only return integer coordinates.
  * [appstyle.canWidgetFocus(win, widget)](docs/helper-functions.md#can-widget-focus) - returns `true` if a widget can receive keyboard input focus.
  * [appstyle.isWithinWidget(win, widget, x, y, absolute)](docs/helper-functions.md#is-within-widget) - returns `true` if the specified x and y pixel coordinates are within the coordinates of the specified widget.  if absolute is `true`, the pixel coordinates are local coordinates for the window, and if `false`, they are relative to the specified widget's parent widget.
