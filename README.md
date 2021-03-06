# appstyle
appstyle.js - a window manager for HTML5 canvas

# Quick Start Guide

## How do I start using appstyle?

Here's a minimal example of an appstyle app:

```html
<!DOCTYPE html>
<head>
<title>Minimal Appstyle Example</title>
<script src="appstyle.js"></script>
<script>

  function myWindowWidgets(win) {
    appstyle.text(win, 'Hello World', {x: 0, y: 0, w: 20});
  }

  appstyle.ready(function() {
    appstyle.registerWindowClass('myWindow', {
      title: 'My Window',
      widgets: myWindowWidgets
    });
    appstyle.makeWindow({class: 'myWindow'});
  });

</script>
</head>
```

### Demo

You can see a small live demo here: https://zebby.org/appstyle/

## Concepts

### Using Window Classes to define Callback Functions

When you use [appstyle.registerWindowClass()](docs/windows.md#appstyleregisterwindowclassclassname-props) you get to specify some callbacks that let you define and override functionality of an appstyle window:

  * [widgets(win)](docs/callbacks.md#widgets-handler) - this defines the layout of a window
  * [event(win, evt)](docs/callbacks.md#event-handler) - this lets you respond to things such as user interaction (buttons being clicked, etc.)
  * [paint(win, ctx)](docs/callbacks.md#paint-handler) - for changing the behavior of a how a window is painted.
  * [paintPane(win, ctx, pane)](docs/callbacks.md#paintPane-handler) - for changing the behavior of how a pane is painted.

In addition to callbacks, you can also specify whatever other default options you would like windows of this class to have. If you plan to share your Window Classes with other developers, choose a Class Name that is prefixed with a vendor identifier.  We use "appstyle." to prefix Window Classes provided by the appstyle library.

### Creating Windows

Once you have a Window Class registered you can make a window by calling [appstyle.makeWindow()](docs/windows.md#appstylemakewindowprops) pass along a list of options. Here are a few examples:

  * `class` - the Window Class for the type of window you'd like to create
  * `title` - the title of this window
  * `x`, `y` - the initial x and y coordinates (in pixels) for this window (from the upper left corner)
  * `w`, `h` - the width and height (in character grid units) for this window
  * `horizontalSize` - set this to `true` to allow horizontal resizing of this window
  * `verticalSize` - set this to `true` to allow vertical resizing of this window

For the complete list of properties, see [Window Properties](docs/windows.md#window-properties).

### The Character Grid vs. Pixel Coordinates

Although you can use pixels to place and position everything, we provide a "[Character Grid](docs/grid-system.md#character-grid)" to help make window layout easier, and to make programming more akin to the text-mode development common on computers of the 1980s.

Any time you specify a width or height, or the x or y coordinate of a widget within a window, you can use this system. The coordinates do not need to be whole numbers, so if you want to place something half way between line 1 and 2, just use 1.5.  If you find the need to use pixel sizing and placement for a specific widget, we have a "[Pixel Mode](docs/grid-system.md#pixel-mode)" option to do this as well.

### Writing your Widget Handler

The [Widget Handler](docs/callbacks.md#widgets-handler) for a window gets called every time the window needs to be refreshed. This happens frequently, for example, when the window is resized, when the mouse pointer passes over a Widget, or when underlying data has changed. The purpose of the Widget handler is to generate the list of widgets that will be used to respond to future mouse input and to paint the window.

The default paint handler is sufficient to show most of the available stock widgets, so to make a nice looking window, all you usually need to do is write the Widget Handler.

Generally speaking, Widgets will be painted in the order they are defined, so if you want something to overlap something else, define it after the Widget it needs to go on top of.

Some of the Widgets included in the standard library are:

  * [appstyle.text(win, caption, props)](docs/widgets/README.md#text) - Shows some text. (Limited to a single line.)
  * [appstyle.textInput(win, storage, defaultValue, props)](docs/widgets/README.md#text-input) - Allows the user to input text. This currently has some limitations because it falls back to the HTML DOM when it is focused.
  * [appstyle.button(win, id, caption, props)](docs/widgets/README.md#button) - A pushbutton the user can click to trigger some sort of action.

For a complete list of Widgets, see the [Documentation Index](docs/README.md)

In order to create a Widget in the Widget Handler, just call its corresponding function, passing along the window object, and specifying any other required parameters. Any additional properties may be added by including them in the `props` object:

```js
function myWindowWidgets(win) {
  appstyle.button(win, 'myButton', 'Click Me!', {x:0, y:0, w:10});
}
```

If you're going to be creating several Widgets that share common properties, you might find it convenient to call `setWidgetDefaults(props)` to specify them.  Calling it again with an empty object, as in `setWidgetDefaults({})`, will remove any defaults that have been set. The Widget Defaults start out blank each time your Widget Handler is called.

### Responding to Events

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

appstyle.ready(function() {
  appstyle.registerWindowClass('myWindow', {
    title: 'My Window',
    widgets: myWindowWidgets,
    event: myWindowEvent
  });
  appstyle.makeWindow({class: 'myWindow'});
});
```

Here are some common types of events you can respond to:

  * [keyPress](docs/keyboard-events.md#key-press) - fired when a keyboard key is pressed and released, or when the key auto-repeats due to being held down
  * [click](docs/mouse-events.md#click) - fired when the mouse is released on the same widget where it was pressed down
  * [drop](docs/mouse-events.md#drop) - fired when a drag and drop operation ends
  * [focus](docs/focus.md#focus) - fired when any interactive widget gets keyboard focus
  * [blur](docs/focus.md#blur) - fired when any interactive wiget loses keyboard focus

For a comprehensive list of Events, see the [Documentation Index](docs/README.md)

## Congratulations!

You're now writing programs with appstyle!

For further details, see the [Documentation Index](docs/README.md)
