
# Vasudha Connect - Community Family Tree

Vasudha Connect is a modern, open-source web application designed to build, explore, and visualize family relationships within a close-knit community. It was created with the vision of providing a simple yet powerful tool for villages and community groups to document their heritage and understand the intricate web of connections that bind them together.

The application is built to be intuitive for public users and powerful for administrators, ensuring data integrity while fostering a sense of shared history.

## ✨ Core Features

### For Public Users
- **Profile Registration:** An easy-to-use form allows community members to register themselves and their immediate family.
- **Dynamic Dropdowns:** The registration form features smart, dynamic dropdowns for surnames and family groups, simplifying data entry and improving consistency.
- **Interactive Profile Pages:** Each person has a detailed profile page that visually displays their immediate family, including parents, spouse, children, siblings, and grandparents.
- **Deep Relationship Mapping:** The profile page goes beyond the immediate family, showing extended relationships like in-laws, uncles, and aunts.
- **Community Exploration:** A powerful search and filter interface allows users to easily find anyone in the community.

### For Administrators
- **Secure Admin Panel:** A protected admin area with a secure, email and password-based login system.
- **Interactive Dashboard:** A central dashboard provides key statistics at a glance (Total Users, Deceased Members, etc.). The dashboard is fully interactive, allowing admins to click on stats and charts to view filtered lists of users.
- **Comprehensive User Management:** A detailed table allows admins to view, edit, and delete any user profile.
- **Effortless Relationship Linking:** Admins can easily link relatives (parents, spouses) through an intuitive modal interface, ensuring the family tree remains accurate and connected.
- **Bulk Actions:** Admins can select multiple users to perform bulk actions, such as marking them as deceased or deleting them.
- **Data Export:** Admins can export the entire user database to an Excel file with a single click.

## 🚀 Technology Stack

The application is built on a modern, robust, and open-source technology stack, chosen for its performance, developer experience, and scalability.

- **Framework:** **Next.js (App Router)** - For a fast, server-rendered React application.
- **Language:** **TypeScript** - For type safety and improved code quality.
- **Styling:**
  - **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
  - **shadcn/ui:** A collection of beautifully designed, reusable UI components.
- **Backend & Data:**
  - **Supabase:** The backend is powered by Supabase for database storage, providing a scalable and secure data solution.
  - **Next.js Server Actions:** All backend logic (creating, reading, updating, deleting data) is handled through Server Actions, providing a seamless and secure way to interact with the Supabase database.
- **State Management:** Primarily managed with React hooks (`useState`, `useMemo`, `useEffect`) for local component state.
- **Icons:** **Lucide React** - For a clean and consistent icon set.

## 🧠 Application Logic

### User ID Generation
Each user is assigned a unique, random 8-character alphanumeric ID upon registration. This ensures that every user has a stable, non-personally identifiable identifier that can be used for linking and database lookups. The system automatically checks for collisions to guarantee uniqueness.

### Image Handling
To optimize storage and performance, all user-uploaded profile pictures are handled through a robust pipeline:
- **In-Browser Processing:** Pictures are first processed through an in-browser cropper and compressor, resizing them to a maximum of 400px and compressing them to approximately 50KB.
- **Supabase Storage:** The processed image is then uploaded directly to a dedicated **Supabase Storage** bucket (`profile-pictures`). This keeps the database lightweight and leverages a scalable solution for file storage.
- **Clean URLs:** Only the clean, public URL for the stored image is saved in the user's database record.

### Relationship Linking
The application's core strength lies in its relationship logic, managed in `src/lib/user-utils.ts`.
- Relationships are stored using unique IDs (`fatherId`, `motherId`, `spouseId`).
- When two users are linked as spouses, the action is **bidirectional**: both profiles are updated to reflect the new marital status and link to each other.
- Profile pages dynamically fetch and display all relevant relatives by traversing these ID links across the entire user dataset.

## 🔮 Future Enhancements

While the core functionality is stable and robust, here are some potential features to deepen the application's value and further the mission of preserving community heritage:

### 1. The "Living History" Feature: Stories & Anecdotes
- **Concept:** Introduce a "Stories" or "Memories" section on each profile page where admins and family members can add short anecdotes, biographical details, or cherished memories about a person.
- **Impact:** This would transform the application from a structural database into a **collaborative digital history book**. It gives context and personality to the names on the tree and allows future generations to feel a much deeper connection to their ancestors.

### 2. The "Data Curator" Dashboard
- **Concept:** Enhance the Admin Dashboard with a "Data Health" or "Attention Needed" widget. This would proactively flag potential data issues and provide direct links to filtered lists.
- **Examples:**
    - Profiles marked 'married' but missing a linked spouse.
    - Profiles with missing parent information.
    - Profiles still using a placeholder profile picture.
    - Potential duplicate entries (e.g., similar names and parent names).
- **Impact:** This turns the admin's role from reactive data entry to proactive **data curation**. It automates the difficult task of finding errors and inconsistencies, which is crucial for maintaining the long-term accuracy and integrity of the family tree as it grows.

### 3. The "Relationship Path" Tool
- **Concept:** Create a simple tool with two dropdowns where a user can select any two people in the community. Upon clicking "Find Connection," the app would display the most direct relationship path between them in plain language.
- **Example Output:** "Ramesh is the paternal uncle (Kaka) of Suresh."
- **Impact:** This provides a powerful "aha!" moment for users by directly answering the common question, "How are we related?" It encourages exploration and helps people understand the intricate web of community connections without the complexity of rendering a full graphical tree.

## Local Development Setup

To run this project on your local machine, you will need a Supabase project.

### 1. Set up Your Supabase Project

1.  Go to [supabase.com](https://supabase.com) and create a new project.
2.  Once your project is ready, navigate to the **SQL Editor** section.
3.  Create the necessary tables by running the SQL schema provided in `supabase_schema.sql` in the project root.
4.  **Set Up Storage Policies:**
    - In your Supabase project dashboard, navigate to **Storage** and create a new **public** bucket named `profile-pictures`.
    - Go back to the **SQL Editor** and run the following three commands to set the security policies for the new bucket. This allows your application to securely upload and retrieve images:

    ```sql
    -- Policy 1: Allow public, anonymous read access to all images
    -- This allows anyone to view profile pictures.
    CREATE POLICY "Public Read Access"
    ON storage.objects FOR SELECT
    TO public
    USING ( bucket_id = 'profile-pictures' );

    -- Policy 2: Allow anonymous users to upload new images
    -- This is required for the public registration form to work.
    CREATE POLICY "Anonymous Insert Access"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK ( bucket_id = 'profile-pictures' );

    -- Policy 3: Allow authenticated users (admins) to update and delete any image
    -- This allows admins to manage all profile pictures from the admin panel.
    CREATE POLICY "Admin Full Access"
    ON storage.objects FOR ALL
    TO authenticated
    USING ( bucket_id = 'profile-pictures' )
    WITH CHECK ( bucket_id = 'profile-pictures' );
    ```
5. **Set Up User Table Policies:**
   - In the **SQL Editor**, run the following commands. These policies ensure that all user profiles are visible to the public, that anyone can create a new profile, and that only **authenticated users (admins)** can modify or delete profiles.

   ```sql
   -- 1. Public Read-Only Access
   -- Allows anyone to view user profiles.
   CREATE POLICY "Allow public read access to all users"
   ON public.users FOR SELECT
   TO public
   USING (true);

   -- 2. Public Insert Access
   -- Allows anyone to create a new user profile (i.e., register themselves).
   CREATE POLICY "Allow public insert access for new users"
   ON public.users FOR INSERT
   TO public
   WITH CHECK (true);

   -- 3. Admin Update Access (IMPORTANT)
   -- Allows authenticated users (admins) to update any user profile.
   CREATE POLICY "Allow admin update access to all users"
   ON public.users FOR UPDATE
   TO authenticated
   USING (true)
   WITH CHECK (true);

   -- 4. Admin Delete Access (IMPORTANT)
   -- Allows authenticated users (admins) to delete any user profile.
   CREATE POLICY "Allow admin delete access to all users"
   ON public.users FOR DELETE
   TO authenticated
   USING (true);
   ```

### 2. Get Supabase Credentials

1.  In your Supabase project dashboard, go to **Settings** -> **API**.
2.  You will find your **Project URL** and your `anon` **public key**.
3.  You will also need your `service_role` **secret key**. Keep this key secure and never expose it on the client-side.
4.  Create a `.env.local` file in the root of your project by copying `.env` and add these keys:
    ```
    NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
    SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_SECRET_KEY
    ```

### 3. Install and Run

1.  **Install Dependencies:**
    Open your terminal, navigate to the project's root directory, and run:
    ```bash
    npm install
    ```

2.  **Run the Development Server:**
    Once the installation is complete, start the Next.js development server:
    ```bash
    npm run dev
    ```

3.  **Open the Application:**
    Open your web browser and navigate to [http://localhost:9002](http://localhost:9002) to see the application in action.

### Admin Access
To access the admin panel, navigate to `/admin/login` and use the email and password you used to sign up with Supabase Authentication. You may need to create an admin user first via the Supabase dashboard.
