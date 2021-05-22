[Return to Documentation Index](/docs/README.mt)

# Internals

These are internal functions that may be useful, but should be considered experimental features subject to significant changes.

### appstyle.internals.processWindowMetrics(win, ctx)

This causes a window to recalculate its geomtery based on its current properties. It may be needed if you've modified a window's properties during a handler and expect the changes to be reflected during the same frame.

### appstyle.internals.forceRefresh()

This is a heavy geometry refresh of the entire canvas. It checks the current browser window size, resizes the canvas, and recalculates the geometry on all windows.

### appstyle.internals.getEnvironment()

This returns the current environment as an object. An environment includes all current windows, with their properties and storage objects. It will not include temporary values, internal geometry values, or any properties whose value is equivalent to the default value for the given Window Class.

### appstyle.internals.setEnvironment(env)

(Not completed yet.) This sets an environment based on the object passed into it.

### appstyle.internalssaveEnvironment()

Saves a copy of the current environment in browser localStorage.

### appstyle.internals.loadEnvironment()

This loads the saved copy of the current environment from browser localStorage.

### appstyle.internals(resetEnvironment)

This resets the current environment. All windows will be destroyed and you'll be left with a blank canvas.
