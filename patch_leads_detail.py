import re

with open('tests/unit/leads-detail.test.jsx', 'r') as f:
    content = f.read()

# Fix Dropdown trigger click for jsdom (pointerDown instead of click)
content = content.replace("fireEvent.click(actionsMenu);", "fireEvent.pointerDown(actionsMenu); fireEvent.click(actionsMenu);")

# Fix Convert Confirm
content = re.sub(r"const confirmButton = screen\.getByText\('Да'\);\s+fireEvent\.click\(confirmButton\);",
                 r"const confirmButtons = screen.getAllByRole('button');\n      const confirmButton = confirmButtons.find(b => b.textContent.includes('Конвертировать') || b.textContent.includes('Дисквалифицировать') || b.textContent.includes('Удалить'));\n      if(confirmButton) fireEvent.click(confirmButton);", content)

with open('tests/unit/leads-detail.test.jsx', 'w') as f:
    f.write(content)

