# authsignal-browser

## API

### challengeWithPopup

You will need to add the following CSS to your application if using this method:

```css
.dialog-container,
.dialog-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.dialog-container {
  z-index: 2;
  display: flex;
}

.dialog-container[aria-hidden="true"] {
  display: none;
}

.dialog-overlay {
  background-color: rgba(43, 46, 56, 0.9);
}

.dialog-content {
  margin: auto;
  z-index: 2;
  position: relative;
  background-color: white;
}
```
