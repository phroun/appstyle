[Return to Documentation Index](/docs/README.md)

# Window Management

## appstyle.registerWindowClass(className, props)

When you use appstyle.registerWindowClass() you get to specify some callbacks that let you define and override functionality of an appstyle window:

  * [widgets(win)](docs/callbacks.md#widgets-handler) - this defines the layout of a window
  * [event(win, evt)](docs/callbacks.md#event-handler) - this lets you respond to things such as user interaction (buttons being clicked, etc.)
  * [paint(win, ctx)](docs/callbacks.md#paint-handler) - for changing the behavior of a how a window is painted.
  * [paintPane(win, ctx, pane)](docs/callbacks.md#paintPane-handler) - for changing the behavior of how a pane is painted.

In addition to callbacks, you can also specify whatever other default options you would like windows of this class to have. If you plan to share your Window Classes with other developers, choose a Class Name that is prefixed with a vendor identifier.  We use "appstyle." to prefix Window Classes provided by the appstyle library.

## appstyle.makeWindow(props)]

As a minimum, props should include a field called `class` which specifies which Window Class to apply to the window being created.

## Window Properties

  * `class` - the Window Class for the type of window you'd like to create
  * `title` - the title of this window
  * `noCloseBtn` - set this to `true` to remove the close button from the window
  * `titleBar` - set this to `false` to remove the title bar of a window (be careful, there's no default way to move a window without a title bar)
  * `toolFrame` - set this to `true` to use a smaller title bar and sizer style for this window
  * `neverRaise` - set this to `true` to prevent a window from automatically raising to the top when it receives focus.
  * `x`, `y` - the initial x and y coordinates (in pixels) for this window (from the upper left corner)
  * `w`, `h` - the width and height (in character grid units) for this window
  * `z` - the current z-order of this window. higher numnbers show on top of lower numbers. these get frequently re-enumerated.
  * `pixel` - set this to `true` to specify `w` and `h` as pixels instead of character grid units
  * `charGrid` - set thi to `true` to make the character grid visible (useful for debugging!)
  * `charWidth` - set this to override the default horizontal spacing of the character grid
  * `charHeight` - set this to override the default vertical spacing of the character grid
  * `charOffsetX` - set this to override the default horizontal offset of the character grid
  * `charOffsetY` - set this to override the default vertical offset of the character grid
  * `horizontalSize` - set this to `true` to allow horizontal resizing of this window
  * `verticalSize` - set this to `true` to allow vertical resizing of this window
  * `cursor` - set this to to a cursor number to change which mouse cursor is displayed when the pointer is over the content area of this window
  * `immediate` - Normally, a window's widget list is only reconstructed when appstyle thinks the window needs to be redrawn. Set this to `true` to force the window's widget list to be reconstructed in real time on every frame (usually 60 times per second.) Set it to a number and it will be reconstructed every time the specified number of frames has passed. The window's widget list may be reconstructed more often than you have requested, for example, if the browser or the window is resized, or if the mouse pointer passes over or out of a previously defined widget.
  * `retain` - Set this to `true` and the results of the paint operation will be kept, rather than being redrawn every frame. You can force an actual redraw to occur at the end of this frame by calling `appstyle.redraw(win)` (in the Widget Handler, for instance.)  When `retain` is combined with `immediate`, you may reconstruct your widget list each frame, but only repaint the widgets if you detected that an actual change has occurred.

### Mouse Cursor Numbers

  0. pointer (arrow)
  1. crosshair
  2. horizontal sizer
  3. vertical sizer
  4. diagonal sizer

### Accessing the Window List

Callbacks and event handlers provide you with the appropriate window object directly, but if you ever find yourself with a window id (wid) and need to access the corresponding window object you can do so by using `appstyle.windowList[wid]`.

### Window Manager Events
  * [close](docs/windows.md#window-manager-events) - fired when the close button in the upper corner of the window is activated
