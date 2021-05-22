# appstyle
appstyle.js - a window manager for HTML5 canvas

# How do I start using appstyle?

Currently jQuery is required, and needs to be loaded first. The dependency on jQuery is actually quite minimal and should be able to be removed in the near future.

Here's a minimal example of an appstyle app:

```html
<!DOCTYPE html>
<head>
<title>Minimal Appstyle Example</title>
<script type="text/javascript" src="jquery-3.6.0.min.js"></script>
<script type="text/javascript" src="appstyle.js"></script>
<script type="text/javascript">

  function myWindow(win, ctx) {
    appstyle.text(win, 'Hello World', {x: 0, y: 0, w: 20});
  }

  $(document).ready(function() {
    appstyle.registerWindowClass('myWindow', {
      title: 'My Window',
      widgets: myWindow
    });
    appstyle.makeWindow({class: 'myWindow'});
  });

</script>
</head>
```

# Concepts

### Window Classes

When you use [appstyle.registerWindowClass()](docs/registerWindowClass.md) you get to specify some callbacks that let you define and override functionality of an appstyle window:

  * [widgets](docs/callbacks/widgets.md) - this defines the layout of a window
  * [events](docs/callbacks/event.md) - this lets you respond to things such as user interaction (buttons being clicked, etc.)
  * [paint](docs/callbacks/paint.md) - for changing the behavior of a how a window is painted.
  * [paintPane](docs/callbacks/paintPane.md) - for changing the behavior of how a pane is painted.

In addition to callbacks, you can also specify whatever other default options you would like windows of this class to have. If you plan to share your Window Classes with other developers, choose a Class Name that is prefixed with a vendor identifier.  We use "appstyle." to prefix Window Classes provided by the appstyle library.

### The Character Grid

Although you can use pixels to place and position everything, we provide a "[Character Grid](docs/CharacterGrid.md)" to help make window layout easier, and to make programming more akin to the text-mode development common on computers of the 1980s.

Any time you specify a width or height, or the x or y coordinate of a widget within a window, you can use this system. The coordinates do not need to be whole numbers, so if you want to place something half way between line 1 and 2, just use 1.5.  If you find the need to use pixel sizing and placement for a specific widget, we have an option to do this as well.

### Creating Windows

Once you have a Window Class registered you can make a window by calling [appstyle.makeWindow()](docs/makeWindow.md) pass along a list of options. Here are a few examples:

  * class - the Window Class for the type of window you'd like to create
  * title - the title of this window
  * toolFrame: true - use a smaller title bar for this window
  * x, y - the initial x and y coordinates (in pixels) for this window (from the upper left corner)
  * w, h - the width and height (in character grid units) for this wnidow
  * horizontalSize: true - allow horizontal resizing of this window
  * verticalSize: true - allow vertical resizing of this window

### Writing your Widget Handler

The [Widget Handler](docs/WidgetHandler.md) for a window gets called every time the screen is painted. Its purpose is to generate the list of widgets that will be used to respond to mouse input and to paint the window.

The default paint handler is sufficient to show most of the available stock widgets, so to make a nice looking window, all you usually need to do is write the Widget Handler.

Generally speaking, Widgets will be painted in the order they are defined, so if you want something to overlap something else, define it after the Widget it needs to go on top of.

#### Widgets included in the standard library:

  * [appstyle.text](docs/text.md) - Shows some text. (Limited to a single line.)
  * [appstyle.textInput](docs/textInput.md) - Allows the user to input text. This currently has some limitations because it falls back to the HTML DOM when it is focused.
  * [appstyle.button](docs/button.md) - A pushbutton the user can click to trigger some sort of action.
  * [appstyle.pane](docs/pane.md) - A container to hold other widgets. Supports scrolling.
  * [appstyle.custom](docs/custom.md) - Any other widget. You'll need to provide your own painting and event handlers.

### Responding to Events

You'll need to write an [Event Handler](docs/EventHandler.md) for your Window Class in order to respond to events.

#### Window Manager Events
  * [close](docs/events/close.md) - fired when the close button in the upper corner of the window is activated

#### Keyboard Events
  * [keyDown](docs/events/keyDown.md) - fired when a keyboard key is pressed down
  * [keyUp](docs/events/keyUp.md) - fired when a keyboard key is released
  * [keyPress](docs/events/keyPress.md) - fired when a keyboard key is pressed and released, or when the key auto-repeats due to being held down continuously

#### Mouse Events
  * [mouseDown](docs/events/mouseDown.md) - fired when the mouse button is pressed down
  * [mouseUp](docs/events/mouseUp.md) - fired when the mouse button is released
  * [click](docs/events/click.md) - fired when the mouse is released on the same widget where it was pressed down
  * [dblClick](docs/events/dblClick.md) - fired when two clicks happen on the same widget in rapidy successio
  * [dragFrame](docs/events/dragFrame.md) - fired when the user begins to move the window by dragging the window's title bar
  * [dropFrame](docs/events/dropFrame.md) - fired when the user ends moving a window by way of dragging the window's title bar
  * [drop](docs/events/drop.md) - fired when a drag operation ends
  * [dropOnFrame](docs/events/dropOnFrame.md) - fired when a drag operation ends but the cursor is over the frame rather than the content area of the target window

#### Focus Events
  * [focus](docs/events/focus.md) - fired when any interactive widget gets keyboard focus
  * [blur](docs/events/blur.md) - fired when any interactive wiget loses keyboard focus
  * [focusFirst](docs/events/focusFirst.md) - fired when focus is supposed to go to the first interactive widget
  * [focusNext](docs/events/focusNext.md) - fired when focus is supposed to go to the next interactive widget in squence
  * [focusPrior](docs/events/focusPrior.md) - fired when focus is supposed to go to the prior interactive widget in sequence
  * [focusLast](docs/events/focusLast.md) - fired when focus is supposed to go to the last interactive widget in sequence
