# AI Rules and Project Guidelines

This document outlines the core technologies used in this application and provides clear guidelines for their usage. Adhering to these rules ensures consistency, maintainability, and optimal performance across the codebase.

## Tech Stack Overview

1.  **React**: The foundational JavaScript library for building dynamic and interactive user interfaces.
2.  **TypeScript**: Supported for enhanced type safety and developer experience, although current files use `.jsx`.
3.  **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs directly in your markup. All styling should be done using Tailwind CSS classes.
4.  **React Router**: For declarative routing within the application. Routes should be managed in `src/App.tsx`.
5.  **shadcn/ui**: A collection of re-usable components built with Radix UI and Tailwind CSS. **Always prioritize using shadcn/ui components for UI elements.**
6.  **Lucide React**: A library for beautiful and consistent open-source icons. **Prefer Lucide React icons over `react-icons/fi` for new components.**
7.  **`html2pdf.js`**: For client-side PDF generation, as seen in `index.html`.
8.  **`react-hot-toast`**: For displaying toast notifications to the user.
9.  **Supabase (Optional Integration)**: For authentication, database, and server-side functions. If required, it will be integrated via the Dyad platform.
10. **ECharts & `echarts-for-react`**: For data visualization, though currently unused.

## Library Usage Rules

*   **UI Components**:
    *   **Primary Choice**: Always use components from `shadcn/ui` when available and suitable for the design.
    *   **Custom Components**: If a `shadcn/ui` component doesn't fit, create a new, small, focused component in `src/components/` and style it with Tailwind CSS.
*   **Styling**:
    *   **Exclusive Use**: All styling must be done using **Tailwind CSS classes**. Do not use inline styles, traditional CSS files (other than `src/App.css` and `src/index.css` for `@tailwind` directives), or other styling libraries.
    *   **Responsiveness**: Designs must always be responsive, utilizing Tailwind's responsive utility classes.
*   **Icons**:
    *   **Preferred**: Use icons from `lucide-react`.
    *   **Existing**: While `react-icons/fi` is currently used, new icon implementations should favor `lucide-react`.
*   **Routing**:
    *   **Standard**: Use `react-router-dom` for all client-side routing.
    *   **Route Definition**: Define all main application routes within `src/App.tsx`.
*   **State Management**:
    *   **Default**: Use React's built-in `useState` and `useContext` hooks for local and global state management, respectively.
    *   **Complex State**: For more complex global state, consider a dedicated state management library if explicitly requested and justified.
*   **Form Handling**:
    *   **Basic Forms**: Use standard HTML form elements with React state for basic form handling.
    *   **Validation**: Implement client-side validation as needed.
*   **API Calls**:
    *   **Standard Fetch**: Use the browser's native `fetch` API or `axios` (if installed) for making API requests.
    *   **Supabase**: If Supabase is integrated, use its client library for database and authentication interactions.
*   **Notifications**:
    *   **Toasts**: Use `react-hot-toast` for all user notifications (success, error, loading messages).
*   **PDF Generation**:
    *   **Client-side**: Use `html2pdf.js` for generating PDFs from HTML content.
*   **Data Visualization**:
    *   **Charts**: Use `echarts` and `echarts-for-react` for any charting or data visualization requirements.

## Project Structure Guidelines

*   **Source Code**: All application source code must reside in the `src` directory.
*   **Pages**: Top-level views or routes should be placed in `src/pages/`. The default entry page is `src/pages/Index.tsx`.
*   **Components**: Reusable UI components should be placed in `src/components/`.
*   **Utilities**: Helper functions, constants, and other non-component logic should be in `src/utils/`.
*   **Hooks**: Custom React hooks should be placed in `src/hooks/`.
*   **File Naming**: Directory names must be all lower-case (e.g., `src/pages`, `src/components`). File names may use mixed-case (e.g., `UserProfile.tsx`).
*   **New Files**: Always create a new file for every new component or hook, no matter how small. Do not add new components to existing files.
*   **`src/App.tsx`**: This file should primarily handle routing and top-level layout.
*   **`src/main.tsx`**: This file is the entry point for rendering the React application.

## General Coding Principles

*   **Simplicity & Elegance**: Prioritize simple, elegant solutions. Avoid over-engineering.
*   **Completeness**: All implemented features must be fully functional with complete code; no placeholders or partial implementations.
*   **Maintainability**: Write clean, readable code with clear variable names and comments where necessary.
*   **Error Handling**: Do not use `try/catch` blocks unless specifically requested. Allow errors to bubble up for better debugging.
*   **No Shell Commands**: Do not instruct the user to run shell commands.