[Return to Documentation Index](/README.md)

# Window Management

## [appstyle.registerWindowClass(className, props)](#register-window-class)

When you use appstyle.registerWindowClass() you get to specify some callbacks that let you define and override functionality of an appstyle window:

  * [widgets(win)](docs/callbacks.md#widgets-handler) - this defines the layout of a window
  * [event(win, evt)](docs/callbacks.md#event-handler) - this lets you respond to things such as user interaction (buttons being clicked, etc.)
  * [paint(win, ctx)](docs/callbacks.md#paint-handler) - for changing the behavior of a how a window is painted.
  * [paintPane(win, ctx, pane)](docs/callbacks.md#paintPane-handler) - for changing the behavior of how a pane is painted.

In addition to callbacks, you can also specify whatever other default options you would like windows of this class to have. If you plan to share your Window Classes with other developers, choose a Class Name that is prefixed with a vendor identifier.  We use "appstyle." to prefix Window Classes provided by the appstyle library.

## [appstyle.makeWindow(props)](#make-window)

As a minimum, props should include a field called `class` which specifies which Window Class to apply to the window being created.

## [Window Properties](#window-properties)

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
