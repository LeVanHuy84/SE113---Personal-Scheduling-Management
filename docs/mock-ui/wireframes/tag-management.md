# Tag / Category Management

## Purpose

Allows users to create, rename, and delete tags/categories that are used to organize and color-code appointments on the calendar. Tags help with filtering, statistics grouping, and visual identification.

---

## Layout (ASCII Wireframe)

### Tag Management Page

```
+------------------------------------------------------------------------+
|  PSMS  [🔔]  [Search...]                              [Avatar] John v  |
+------------------+-----------------------------------------------------+
|  NAVIGATION      |  TAGS & CATEGORIES                                  |
|                  |                                                     |
|  Dashboard       |  [+ Create New Tag]                                 |
|  Calendar        |                                                     |
|  Appointments    |  +-------+------------------+-------+---------------+|
|  Tags        <   |  | Color | Tag Name         | Usage | Actions       ||
|  Reminders       |  +-------+------------------+-------+---------------+|
|  Notifications   |  |  ■    | Work             |  12   |  [Rename] [X] ||
|  Statistics      |  |  ■    | Personal         |   7   |  [Rename] [X] ||
|  Export          |  |  ■    | Study            |   5   |  [Rename] [X] ||
|  Profile         |  |  ■    | Health           |   3   |  [Rename] [X] ||
|                  |  |  ■    | Finance          |   0   |  [Rename] [X] ||
|                  |  +-------+------------------+-------+---------------+|
|                  |                                                     |
|                  |  5 tags total                                       |
+------------------+-----------------------------------------------------+
```

### Create New Tag Panel

```
+----------------------------------------------------------+
|  [ Create New Tag ]                                [X]   |
+----------------------------------------------------------+
|                                                          |
|  Tag Name *                                              |
|  [__________________________________________________]    |
|                                                          |
|  Color                                                   |
|  [■] [■] [■] [■] [■] [■] [■] [■]  (color swatches)     |
|   or Custom: [#______]                                   |
|                                                          |
|  Preview:  ● Work  (colored chip preview)               |
|                                                          |
|        [ Cancel ]          [ Save Tag ]                 |
+----------------------------------------------------------+
```

### Rename Tag Modal

```
+------------------------------------------+
|  Rename Tag                          [X]  |
+------------------------------------------+
|                                           |
|  Current name:  Work                      |
|                                           |
|  New Name *                               |
|  [____________________________________]   |
|                                           |
|  Note: This will update the tag name     |
|  across all associated appointments.      |
|                                           |
|   [ Cancel ]        [ Rename ]           |
+------------------------------------------+
```

### Delete Tag Confirmation

```
+------------------------------------------+
|  Delete Tag                          [X]  |
+------------------------------------------+
|                                           |
|  Delete tag "Finance"?                    |
|                                           |
|  This tag will be removed from all        |
|  associated appointments.                 |
|                                           |
|   [ Cancel ]        [ Delete ]           |
+------------------------------------------+
```

---

## Components

- **"+ Create New Tag" button**: Opens the create tag panel/modal
- **Tags table**: Columns — Color swatch, Tag Name, Usage count (number of appointments using this tag), Actions
- **Rename button**: Opens the rename modal for a specific tag
- **Delete button (X)**: Opens confirmation dialog
- **Color swatch picker**: Predefined palette of 8 colors and a custom hex input
- **Preview chip**: Live preview of the tag appearance
- **Name input**: Text field for tag name with duplicate-name validation
- **Record count**: Shows total number of tags at the bottom

---

## User Actions

- View all existing tags with their colors and usage counts
- Click "+ Create New Tag" and fill in a name and color to create a new tag
- See a live preview of the tag chip before saving
- Click "Rename" on an existing tag to change its name
- Click the delete (X) icon and confirm to permanently delete a tag
- Understand that renaming or deleting propagates to all associated appointments
- See an error message if the tag name already exists upon creation
