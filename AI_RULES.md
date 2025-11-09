# AI Rules for LeaveSystem Application

This document outlines the core technologies used in the LeaveSystem application and provides guidelines for using specific libraries and tools.

## Tech Stack Description

*   **React**: The primary JavaScript library for building the user interface.
*   **TypeScript**: A superset of JavaScript that adds static typing, enhancing code quality and maintainability.
*   **Tailwind CSS**: A utility-first CSS framework used for all styling, enabling rapid and consistent UI development.
*   **Lucide React**: A collection of open-source icons integrated for visual elements throughout the application.
*   **jsPDF & html2canvas**: Libraries used together for generating PDF documents from HTML content.
*   **XLSX (SheetJS)**: A comprehensive library for reading, parsing, and writing Excel spreadsheets, used for data import and export.
*   **Pako**: A zlib-compatible compression library used for compressing and decompressing data, specifically for the sync code functionality.
*   **React Router**: The standard library for declarative routing in React applications.
*   **shadcn/ui**: A collection of reusable components built with Radix UI and Tailwind CSS, providing accessible and customizable UI elements.
*   **Radix UI**: A low-level UI component library providing unstyled, accessible components, which shadcn/ui builds upon.

## Library Usage Rules

*   **UI Components**:
    *   **Always** prioritize using components from `shadcn/ui` for common UI patterns (e.g., buttons, forms, dialogs, tables).
    *   If a specific component is not available in `shadcn/ui` or requires significant deviation from its design, consider building a new component using `Radix UI` primitives and `Tailwind CSS` for styling.
    *   **Never** modify the source files of `shadcn/ui` or `Radix UI` components directly. Create new components if customization is needed.
*   **Styling**:
    *   **Exclusively** use `Tailwind CSS` classes for all styling. Avoid inline styles or custom CSS files unless absolutely necessary for very specific, isolated cases (which should be rare).
    *   Ensure designs are responsive by utilizing Tailwind's responsive utility classes.
*   **Icons**:
    *   **Always** use icons from the `lucide-react` library.
*   **PDF Generation**:
    *   Use `jsPDF` in conjunction with `html2canvas` for generating PDF reports and employee cards.
*   **Excel Operations**:
    *   Use the `XLSX` library for all Excel file import and export functionalities.
*   **Data Compression/Sync**:
    *   The `Pako` library is designated for data compression and decompression, specifically for the application's sync code feature.
*   **Routing**:
    *   Implement routing using `React Router`. All main application routes should be defined and managed within `src/App.tsx`.
*   **State Management**:
    *   For local component state, use React's built-in `useState` and `useReducer` hooks.
    *   For memoization and performance optimization, use `useCallback` and `useMemo`.
*   **API Calls**:
    *   All data interactions (fetching, adding, updating, deleting) should go through the `apiService.ts` module, which currently simulates a backend using `localStorage`.
*   **Notifications**:
    *   Use a toast notification system (e.g., `react-hot-toast` if installed, or a custom solution) to inform users about important events (success, error, loading).