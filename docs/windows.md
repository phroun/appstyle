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
