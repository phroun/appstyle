[Return to Documentation Index](/docs/README.md)

# Widget State Storage

Sometimes widgets need to remember something.  For example, a ``textInput`` needs to know what has been typed into it, a ``pane`` needs to remember its current scrolling position, and a ``checkbox`` needs to remember whether or not it is checked!  Every time a window needs to be re-drawn, the set of widget objects to be processed and painted gets re-created.  Because of this, they can't internally hold any sort of persistent state on their own.  To solve this, the window has an object called `storage` attached to it.  Each widget that needs to store data has a `storage` property which specifies a key into the window `storage` object where an object containing its persistent data will be held (by convention, each widget's `storage` key is usually set to the same value as its `id` property.)  Note: Only widgets that require storage will have a storage key.

To get and set values in a widget's storage object, you can access them directly on the window object:

```javascript
window.storage[widget.storage].value
```
# Widget Identification

If you are writing a Widget Handler for a very dynamic window, that the number of Widgets in your window may vary over time.  Because of this, if you need to keep track of a particular Widget, you should assign it a meaningful id.  Widgets like buttons and textInputs require an id as part of their definition, but you can also add an id into the properties list of any widget.  You can then use this id, for example, in mouse events, to tell if that particular widget has been interacted with.
