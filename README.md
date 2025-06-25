# 📖 My Journal App

A simple, elegant journaling application built with HTML, CSS, and JavaScript. Write your thoughts, track your mood, and keep your memories safe with this beautiful web app.

## ✨ Features

- **Write & Save Entries**: Create journal entries with a clean, distraction-free writing interface
- **Mood Tracking**: Select your mood for each entry with emoji indicators
- **Persistent Storage**: All entries are saved in your browser's localStorage
- **Search & Filter**: Find specific entries by keyword or mood
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful gradient design with smooth animations

## 🚀 How to Use

1. **Open the App**: Simply open `index.html` in your web browser
2. **Write an Entry**: 
   - Type your thoughts in the text area
   - Optionally select your mood from the dropdown
   - Click "Save Entry" to save
3. **View Entries**: All your entries appear below in reverse chronological order
4. **Search & Filter**: 
   - Use the search box to find entries containing specific words
   - Use the mood filter to see entries with a particular mood
5. **Your Data**: All entries are stored locally in your browser - no internet required!

## 📁 File Structure

```
Journal App/
├── index.html      # Main HTML structure
├── styles.css      # All styling and responsive design
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## 🛠️ Technical Details

### Core Functions

- **`handleFormSubmit()`**: Processes new journal entries
- **`saveEntries()`**: Saves entries to localStorage
- **`loadEntries()`**: Loads entries from localStorage on page load
- **`displayEntries()`**: Renders entries in the UI
- **`filterEntries()`**: Handles search and mood filtering
- **`createEntryCard()`**: Creates individual entry display cards

### Data Structure

Each journal entry is stored as an object:
```javascript
{
  id: 1234567890,           // Unique timestamp ID
  text: "My journal entry", // The entry content
  mood: "happy",           // Selected mood (optional)
  date: "2024-01-01T12:00:00.000Z", // ISO date string
  timestamp: 1234567890    // Unix timestamp
}
```

### Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## 🎨 Customization

### Adding New Moods

To add new mood options, edit the mood options in both `index.html` and `script.js`:

1. In `index.html`, add new options to both mood selectors:
```html
<option value="new-mood">😊 New Mood</option>
```

2. In `script.js`, add the mood to the `getMoodInfo()` function:
```javascript
'new-mood': { emoji: '😊', text: 'New Mood' }
```

### Styling Changes

The app uses CSS custom properties and modern styling. Key areas for customization:

- **Colors**: Modify the gradient in `body` background
- **Layout**: Adjust the grid layout in `main`
- **Cards**: Customize entry card appearance in `.entry-card`

## 🔧 Development

### Running Locally

1. Clone or download the files
2. Open `index.html` in your browser
3. Start journaling!

### No Build Process Required

This app is pure HTML, CSS, and JavaScript - no build tools, frameworks, or dependencies needed.

### Browser Storage

- Uses `localStorage` for data persistence
- Data is stored locally in your browser
- No data is sent to external servers
- Clear browser data to reset the app

## 🐛 Troubleshooting

### Common Issues

1. **Entries not saving**: Check if localStorage is enabled in your browser
2. **App not loading**: Ensure all files are in the same directory
3. **Styling issues**: Try refreshing the page (Ctrl+F5 or Cmd+Shift+R)

### Data Recovery

If you need to backup your entries, you can:
1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Find localStorage and copy the `journalEntries` value

## 📱 Mobile Usage

The app is fully responsive and works great on mobile devices:
- Touch-friendly interface
- Optimized for small screens
- Easy text input on mobile keyboards

## 🤝 Contributing

Feel free to enhance this app! Some ideas:
- Add entry editing functionality
- Implement entry categories/tags
- Add export/import features
- Create different themes
- Add entry statistics/analytics

## 📄 License

This project is open source and available under the MIT License.

---

**Happy Journaling! 📝✨** 