# appstyle
appstyle.js - a window manager for HTML5 canvas

# How do I start using appstyle?

Currently jQuery is required, and needs to be loaded first. The dependency on jQuery is actually quite minimal and should be able to be removed in the near future.

Here's a minimal example of an appstyle app:

```html
<!DOCTYPE html>
<head>
<title>Minimal Appstyle Example</title>
<script src="https://code.jquery.com/jquery-3.6.0.min.js" integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>
<script src="appstyle.js"></script>
<script>

  function myWindowWidgets(win, ctx) {
    appstyle.text(win, 'Hello World', {x: 0, y: 0, w: 20});
  }

  $(document).ready(function() {
    appstyle.registerWindowClass('myWindow', {
      title: 'My Window',
      widgets: myWindowWidgets
    });
    appstyle.makeWindow({class: 'myWindow'});
  });

</script>
</head>
```

Note: If you want your code to run without dependency on Internet access, you should download jquery and reference it locally with `<script src="jquery-3.6.0.min.js"></script>` instead of loading it from a CDN.

# Concepts

## Using Window Classes to define Callback Functions

When you use [appstyle.registerWindowClass()](docs/windows.md#register-window-class) you get to specify some callbacks that let you define and override functionality of an appstyle window:

  * [widgets(win)](docs/callbacks.md#widgets-handler) - this defines the layout of a window
  * [event(win, evt)](docs/callbacks.md#event-handler) - this lets you respond to things such as user interaction (buttons being clicked, etc.)
  * [paint(win, ctx)](docs/callbacks.md#paint-handler) - for changing the behavior of a how a window is painted.
  * [paintPane(win, ctx, pane)](docs/callbacks.md#paintPane-handler) - for changing the behavior of how a pane is painted.

In addition to callbacks, you can also specify whatever other default options you would like windows of this class to have. If you plan to share your Window Classes with other developers, choose a Class Name that is prefixed with a vendor identifier.  We use "appstyle." to prefix Window Classes provided by the appstyle library.

## Creating Windows

Once you have a Window Class registered you can make a window by calling [appstyle.makeWindow()](docs/windows.md#make-window) pass along a list of options. Here are a few examples:

  * `class` - the Window Class for the type of window you'd like to create
  * `title` - the title of this window
  * `x`, `y` - the initial x and y coordinates (in pixels) for this window (from the upper left corner)
  * `w`, `h` - the width and height (in character grid units) for this window
  * `horizontalSize` - set this to `true` to allow horizontal resizing of this window
  * `verticalSize` - set this to `true` to allow vertical resizing of this window

For the complete list of properties, see [Window Properties](docs/windows.md#window-properties).

## The Character Grid vs. Pixel Coordinates

Although you can use pixels to place and position everything, we provide a "[Character Grid](docs/grid-system.md#character-grid)" to help make window layout easier, and to make programming more akin to the text-mode development common on computers of the 1980s.

Any time you specify a width or height, or the x or y coordinate of a widget within a window, you can use this system. The coordinates do not need to be whole numbers, so if you want to place something half way between line 1 and 2, just use 1.5.  If you find the need to use pixel sizing and placement for a specific widget, we have a "[Pixel Mode](docs/grid-system.md#pixel-mode)" option to do this as well.

## Writing your Widget Handler

The [Widget Handler](docs/callbacks.md#widgets-handler) for a window gets called every time the screen is painted. Its purpose is to generate the list of widgets that will be used to respond to mouse input and to paint the window.

The default paint handler is sufficient to show most of the available stock widgets, so to make a nice looking window, all you usually need to do is write the Widget Handler.

Generally speaking, Widgets will be painted in the order they are defined, so if you want something to overlap something else, define it after the Widget it needs to go on top of.

### Widgets included in the standard library:

  * [appstyle.text(win, caption, props)](docs/text.md) - Shows some text. (Limited to a single line.)
  * [appstyle.textInput(win, storage, defaultValue, props)](docs/textInput.md) - Allows the user to input text. This currently has some limitations because it falls back to the HTML DOM when it is focused.
  * [appstyle.button(win, id, caption, props)](docs/button.md) - A pushbutton the user can click to trigger some sort of action.
  * [appstyle.pane(win, storage, props)](docs/pane.md) - A container to hold other widgets. Supports scrolling.
  * [appstyle.custom(win, className, props)](docs/custom.md) - Any other widget. You'll need to provide your own painting and event handlers.

## Responding to Events

You'll need to write an [Event Handler](docs/callbacks.md#event-handler) for your Window Class in order to respond to events.  Here is a small example:

```js
function myWindowEvent(win, evt) {
  if ((evt.type == 'click') && (evt.target.id == 'myButton')) {
    alert('button was clicked!');
  }
}

function myWindowWidgets(win) {
  appstyle.button(win, 'myButton', 'Click Me!', {x:0, y:0, w:10});
}

$(document).ready(function() {
  appstyle.registerWindowClass('myWindow', {
    title: 'My Window',
    widgets: myWindowWidgets,
    event: myWindowEvent
  });
  appstyle.makeWindow({class: 'myWindow'});
});
```

### Window Manager Events
  * [close](docs/windows.md#window-manager-events) - fired when the close button in the upper corner of the window is activated

### Keyboard Events
  * [keyDown](docs/keyboard-events.md#key-down) - fired when a keyboard key is pressed down
  * [keyUp](docs/keyboard-events.md#key-up) - fired when a keyboard key is released
  * [keyPress](docs/keyboard-events.md#key-press) - fired when a keyboard key is pressed and released, or when the key auto-repeats due to being held down continuously

### Mouse Events
  * [mouseDown](docs/mouse-events.md#mouse-down) - fired when the mouse button is pressed down
  * [mouseUp](docs/mouse-events.md#mouse-up) - fired when the mouse button is released
  * [click](docs/mouse-events.md#click) - fired when the mouse is released on the same widget where it was pressed down
  * [dblClick](docs/mouse-events.md#dbl-click) - fired when two clicks happen on the same widget in rapidy successio
  * [dragFrame](docs/mouse-events.md#drag-frame) - fired when the user begins to move the window by dragging the window's title bar
  * [dropFrame](docs/mouse-events.md#drop-frame) - fired when the user ends moving a window by way of dragging the window's title bar
  * [drop](docs/mouse-events.md#drop) - fired when a drag operation ends
  * [dropOnFrame](docs/mouse-events.md#drop-on-frame) - fired when a drag operation ends but the cursor is over the frame rather than the content area of the target window

### Focus Events
  * [focus](docs/focus.md#focus) - fired when any interactive widget gets keyboard focus
  * [blur](docs/focus.md#blur) - fired when any interactive wiget loses keyboard focus
  * [focusFirst](docs/focus.md#focus-first) - fired when focus is supposed to go to the first interactive widget
  * [focusNext](docs/focus.md#focus-next) - fired when focus is supposed to go to the next interactive widget in squence
  * [focusPrior](docs/focus.md#focus-prior) - fired when focus is supposed to go to the prior interactive widget in sequence
  * [focusLast](docs/focus.md#focus-last) - fired when focus is supposed to go to the last interactive widget in sequence
