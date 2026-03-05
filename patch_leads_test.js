import fs from 'node:fs';

let content = fs.readFileSync('tests/unit/leads-detail.test.jsx', 'utf8');

const radixMocks = `
vi.mock('../../src/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  DropdownMenuLabel: ({ children }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));
vi.mock('../../src/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }) => open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogAction: ({ children, onClick }) => <button onClick={onClick} data-testid="alert-action">{children}</button>,
  AlertDialogCancel: ({ children, onClick }) => <button onClick={onClick} data-testid="alert-cancel">{children}</button>,
  AlertDialogContent: ({ children }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));
`;

content = content.replace("వి.mock('../../src/components/CallButton'", radixMocks + "\nvi.mock('../../src/components/CallButton'");
if (!content.includes('vi.mock(\'../../src/components/ui/dropdown-menu')) {
  content = content.replace("vi.mock('../../src/components/CallButton'", radixMocks + "\nvi.mock('../../src/components/CallButton'");
}

// Fix back button text
content = content.replace(/getByText\('Назад к списку'\)/g, "getByText(/Назад/)");

// Fix convert confirm
content = content.replace(/const confirmButtons = screen.getAllByRole.*if\(confirmButton\) fireEvent.click\(confirmButton\);/gs, "const confirmButton = screen.getByTestId('alert-action'); fireEvent.click(confirmButton);");

fs.writeFileSync('tests/unit/leads-detail.test.jsx', content);
