# [1.1.0](https://github.com/your-commonbase/ycb-companion/compare/v1.0.0...v1.1.0) (2025-02-14)


### Features

* Add OIDC configuration to .env.sample and refactor oidc.ts to utilize environment variables for authentication settings ([b099907](https://github.com/your-commonbase/ycb-companion/commit/b099907dc811ba0e2c6b484589efd0e11730c721))

# 1.0.0 (2025-02-14)


### Bug Fixes

* Add matchCount functionality to search route and enhance EntryPage for internal links and penPals clarity ([733b7ed](https://github.com/your-commonbase/ycb-companion/commit/733b7ed216520bdc3057b5d2fbc7d648fd519ea9))
* Adjust match threshold for search API and enhance uploader functionality ([df9af1c](https://github.com/your-commonbase/ycb-companion/commit/df9af1c3cdf6b09f03637ecb7c885345f51596a0))
* Clean up code styling and comments across components ([1e7aa4e](https://github.com/your-commonbase/ycb-companion/commit/1e7aa4e7f20bc774f2ba2e81a301bf07899c7f4c))
* Clear alias input field after adding alias in Entry component ([f04c460](https://github.com/your-commonbase/ycb-companion/commit/f04c4609e0a71dcef384fb251d25b20cbe7f22ec))
* Correct parent image reference to use item image in ForceDirectedGraph component for accurate rendering ([0c300aa](https://github.com/your-commonbase/ycb-companion/commit/0c300aadb29b93c0a5e663583e63abcde4dc6c08))
* Correct rendering of inbox count in dashboard layout for improved display clarity ([882c7e7](https://github.com/your-commonbase/ycb-companion/commit/882c7e7a45797f1bd9471b20e30882c500f907e6))
* Correctly update comments prop name in ForceFromEntry component and tidy up modal content structure in ForceDirectedGraph component ([7e8f92e](https://github.com/your-commonbase/ycb-companion/commit/7e8f92e8830bb093e228423cd9e1c2843bee7eea))
* Delay input focus in dashboard and entry page for better UX during modal interactions ([bca50d9](https://github.com/your-commonbase/ycb-companion/commit/bca50d94acfbdaae72ba28a7c88dfea8e087f388))
* Enhance API request bodies to include createdAt and improve logging for add operations in route handler ([d8ec0c2](https://github.com/your-commonbase/ycb-companion/commit/d8ec0c2fa9ea5fe826653b91def478b101f58429))
* Enhance SearchModalBeta with token management and error handling ([79fbe89](https://github.com/your-commonbase/ycb-companion/commit/79fbe8971f7f85168969ca70c4896596f67b3889))
* Ensure window reload is called after saving changes in EntryPage component ([f961e32](https://github.com/your-commonbase/ycb-companion/commit/f961e322a1d0c7b449a6f6a4bae81aa18c026c19))
* Improve code clarity by formatting, cleaning up comments, and restructuring async function in EntryPage component ([98b57b0](https://github.com/your-commonbase/ycb-companion/commit/98b57b0736638126e04b103ace8dd32720d4c7f0))
* Improve formatting and reorganize imports in Inbox component for better readability and consistency ([1487055](https://github.com/your-commonbase/ycb-companion/commit/148705512da4b2486b6934d95a31e9fcc5788ee9))
* Improve layout in SearchModalBeta component for better text handling ([f8f2182](https://github.com/your-commonbase/ycb-companion/commit/f8f2182ad1d21f65f07c836609d4610edf7608af))
* Prevent keyboard navigation conflicts with input elements ([923218b](https://github.com/your-commonbase/ycb-companion/commit/923218b80777c60a409e61e343464fbf4e0af584))
* Refactor EntryPage state management for neighbor, comment, and internal link processing with better clarity and incremental updates ([a2ac207](https://github.com/your-commonbase/ycb-companion/commit/a2ac2077df1ce8da5182fa546aa282f53bc20538))
* Refactor search and sharing components with various improvements ([7350cf8](https://github.com/your-commonbase/ycb-companion/commit/7350cf802147fb4b8837f564047bc70a69920a5b))
* Refine comment handling and graph interaction ([1f52b4b](https://github.com/your-commonbase/ycb-companion/commit/1f52b4bd11878450f820112d97a61c3a4ae673ca))
* Remove old NotFoundPage from src/app and migrate it to locale-specific directory ([6f15c33](https://github.com/your-commonbase/ycb-companion/commit/6f15c33114bf21c4302a14eb264746f9e110373f))
* Remove unnecessary index parameter in flatMap for clearer code in ForceDirectedGraph component ([e17a4a2](https://github.com/your-commonbase/ycb-companion/commit/e17a4a2ef3bacc799371774ed6917f4971917191))
* Remove unnecessary logging in auth API fetch route and refine metadata query replacement in search route ([e102ded](https://github.com/your-commonbase/ycb-companion/commit/e102dedd206c0d6b49858bc9556069e85b4ca3ea))
* Remove unnecessary window reload in EntryPage component ([9f45a43](https://github.com/your-commonbase/ycb-companion/commit/9f45a436d3308b2c9112ab547bd71e6f04c4ce8c))
* Return entry object instead of an empty array in catch block ([041513e](https://github.com/your-commonbase/ycb-companion/commit/041513eaca93639bfe49e51fedbfd9e30892b672))
* Simplify event handling by removing unused parameter in click event for ForceDirectedGraph component ([9468116](https://github.com/your-commonbase/ycb-companion/commit/9468116da6c6f5384c86d16c6cafdc7a0030b84f))
* Update author URL rendering in EntryPage component ([4bcf2ce](https://github.com/your-commonbase/ycb-companion/commit/4bcf2ce60f25bbf1e3dd96182e39329eac6268e4))
* Update comments prop name to inputComments in ForceFromEntry component in SimpleDashboard ([2045b60](https://github.com/your-commonbase/ycb-companion/commit/2045b60746512246fc311a64392ec9fc69f48f2f))
* Update EntryPage to process alias data with custom markdown handling for improved rendering ([d88c2e1](https://github.com/your-commonbase/ycb-companion/commit/d88c2e1d5e699fda57232181c4255bb0e391faa6))
* Update Inbox component to fetch entries on page change and set document title for improved user experience ([efcb312](https://github.com/your-commonbase/ycb-companion/commit/efcb312f9602686b2c5d9814b7910fd5eb000418))
* Update MeiliSearch host environment variable in SearchModalBeta component ([be8f288](https://github.com/your-commonbase/ycb-companion/commit/be8f2883e920729bb6aae6c578063052bdb4dc4a))
* Update Uploader API endpoint to use production URL and adjust textarea font size for improved readability ([1f6aefb](https://github.com/your-commonbase/ycb-companion/commit/1f6aefb91b7c953e5d0994143c70e4b6a1d4e38e))


### Features

* Add 'he' library for HTML entity decoding in title and description processing, and update package dependencies accordingly ([013eca0](https://github.com/your-commonbase/ycb-companion/commit/013eca0bd91fd6b959b215ea41d3485ad76bb0ba))
* Add 'r' key shortcut to open a random entry in DashboardLayout and refactor related functionality in EntryPage and SimpleDashboard ([3f98e62](https://github.com/your-commonbase/ycb-companion/commit/3f98e622627ead0e4bca79647f7074cf7801d296))
* Add "Create Upload w/ ChatGPT" link to upload page ([8156668](https://github.com/your-commonbase/ycb-companion/commit/815666862ebbc7953ec77d8635f69fd2f5c78880))
* Add "Garden" link to the dashboard navigation ([4380462](https://github.com/your-commonbase/ycb-companion/commit/4380462e31fa020bddeb4055c9528e2db1aba80d))
* Add ag-grid-community dependency for grid functionality ([9f62524](https://github.com/your-commonbase/ycb-companion/commit/9f625247aedb0626f855a27a01c90494d6f551b0))
* Add ag-grid-react dependency for grid functionality ([b1ad92b](https://github.com/your-commonbase/ycb-companion/commit/b1ad92b629c041d6fe27c3935758ea1975890282))
* Add API_KEY to fetch and list routes for authentication ([41d27ef](https://github.com/your-commonbase/ycb-companion/commit/41d27efbb5d75285838435caf862825d6e43c2ea))
* Add API_KEY to search route for authentication ([2acd00a](https://github.com/your-commonbase/ycb-companion/commit/2acd00ac02c696f07c711f6750ee1a8849d91e2f))
* Add base64 image conversion in ShareModal for JSON export ([8799f60](https://github.com/your-commonbase/ycb-companion/commit/8799f6017a1d307905b018f3ed5404f6ee16812f))
* Add button to call /api/random and populate textarea ([b96082d](https://github.com/your-commonbase/ycb-companion/commit/b96082d44516e8ddc20c64b797735c5c9dd624c2))
* Add cachedFData state to EntryPage component ([3999d0c](https://github.com/your-commonbase/ycb-companion/commit/3999d0ca4b9c21dd6cd31ef6da32935bb6fdcca0))
* Add cellEditorParams to Grid component for limiting text length ([8a9b96d](https://github.com/your-commonbase/ycb-companion/commit/8a9b96d10bfea6a153e8f6d64be5caee54eef450))
* Add commit-hook.js to .gitignore to exclude local commit hooks from version control ([f319d22](https://github.com/your-commonbase/ycb-companion/commit/f319d2280f407f0e8014f106ed815d7900d0f3e6))
* Add custom link component in Chat for improved Markdown link rendering and better user experience ([7cbc174](https://github.com/your-commonbase/ycb-companion/commit/7cbc174eee14d3c6e9af9eecdf05b02946a3d06d))
* Add D3.js and related types for visualizing data with a Force Directed Graph component in EntryPage ([7c3bef7](https://github.com/your-commonbase/ycb-companion/commit/7c3bef716c1970752b8cfe7cfd24114e946e3160))
* Add date selection to GardenDaily component ([e9b9f44](https://github.com/your-commonbase/ycb-companion/commit/e9b9f447bdee310d126d20ae19a8d31ed3903b0b))
* Add feedback link to BaseTemplate and implement sticky behavior for SearchBox ([7b9b6be](https://github.com/your-commonbase/ycb-companion/commit/7b9b6be8dcc45d6695d21272fc33620275bab380))
* Add Flow link to DashboardLayout and integrate loading states in CallAndResponse for better user experience ([aa938d7](https://github.com/your-commonbase/ycb-companion/commit/aa938d7f1d6fb591e373f8f7be2f267140688c34))
* Add Flow Sessions page and API for managing past flow states in the dashboard, enhancing user navigation and data access ([1618d3e](https://github.com/your-commonbase/ycb-companion/commit/1618d3eac8068ad4d58079bf3f29ad9b44d964f4))
* Add functionality to fetch and display random time machine entries in SimpleDashboard with a new button for user interaction ([9886b9d](https://github.com/your-commonbase/ycb-companion/commit/9886b9d9037470d93d0ded2608fcae4e235ab2b6))
* Add image upload functionality and description retrieval ([c9c1642](https://github.com/your-commonbase/ycb-companion/commit/c9c164279c859bb082927279a5e97e707cfed059))
* Add inbox feature to dashboard with count and fetch functionality, including new translations for the inbox link ([92652eb](https://github.com/your-commonbase/ycb-companion/commit/92652eb51fdb59af7c5fd0f3bdea2449e73d1937))
* Add loading state during file upload in Upload component ([b33acc7](https://github.com/your-commonbase/ycb-companion/commit/b33acc7dec80a29568a205ab0afd779fd77da499))
* Add navigation instructions to EntryPage component ([9b62276](https://github.com/your-commonbase/ycb-companion/commit/9b62276f5900933c10403dfffb900a6c245514c8))
* Add node-fetch v3.3.2 to package dependencies, enhance Dashboard layout with share functionality and modal integration ([a9971ec](https://github.com/your-commonbase/ycb-companion/commit/a9971ec2f49a2af2769359387a7fe028d1524958))
* Add node-html-parser dependency and enhance Uploader with new props for text, title, and author defaults in various components ([d13964d](https://github.com/your-commonbase/ycb-companion/commit/d13964d072e72f67bedaed24d0b0ee1b694e7241))
* Add NotFoundPage component to display a friendly message for 404 errors in the application ([9f8cce6](https://github.com/your-commonbase/ycb-companion/commit/9f8cce65b3f17e56392d0cf2f226742bc02ecae1))
* Add OIDC client libraries and refactor auth components for improved user authentication flow in the application ([cc21eb2](https://github.com/your-commonbase/ycb-companion/commit/cc21eb2dfd69712817c8153f591b0859a29b63a9))
* Add onAddToCollection function to Entries component ([1655d85](https://github.com/your-commonbase/ycb-companion/commit/1655d850125c776f8798c511178e394723955b1d))
* Add onEdit function to Entries component ([c9c95df](https://github.com/your-commonbase/ycb-companion/commit/c9c95df213087a85f7b4ad1737bd76d54ff17772))
* Add onEdit function to Entries component ([2733ca0](https://github.com/your-commonbase/ycb-companion/commit/2733ca01bf85bc18d8831451b78fb0574ab6dcad))
* Add onKeyDown event listener to text area in Upload page ([94bc9e3](https://github.com/your-commonbase/ycb-companion/commit/94bc9e31b293eeb4018a156b612a02cec7e5f7e4))
* Add onKeyDown event listener to text area in Upload page ([6e95552](https://github.com/your-commonbase/ycb-companion/commit/6e95552548bef7179cbf5b292175ebb7878e48ea))
* Add onKeyDown event listener to text area in Upload page ([af79fc2](https://github.com/your-commonbase/ycb-companion/commit/af79fc2444012040177e5935fec00beb769ff241))
* Add react-calendar CSS import to GardenDaily page ([db194eb](https://github.com/your-commonbase/ycb-companion/commit/db194eb9a7e3d6a26c6f80985dc6cc4ca30f418a))
* Add ReactMarkdown dependency and render data in Entry component ([ca48573](https://github.com/your-commonbase/ycb-companion/commit/ca48573aa4544ab8f61dec8d77d061a5c54f3be8))
* Add search functionality to EntryPage ([2b8027d](https://github.com/your-commonbase/ycb-companion/commit/2b8027da61cacf48053a1d1df9f97b8b360da8db))
* Add splitIntoWords function for truncating search result text ([c598067](https://github.com/your-commonbase/ycb-companion/commit/c5980675da6c7153332cc96bd8f550582aaf5426))
* Add support for Instagram and TikTok embeds in Garden page ([4b1e3df](https://github.com/your-commonbase/ycb-companion/commit/4b1e3dfa4bfa1fcba42137a8c0b9787c9c1a6b84)), closes [#123](https://github.com/your-commonbase/ycb-companion/issues/123)
* Add title generation feature with API integration and button in Uploader component for enhanced user experience ([81325f0](https://github.com/your-commonbase/ycb-companion/commit/81325f01be43b5031a1ef7031523f7ba97075a67))
* Add total entries count to SimpleDashboard and implement API for fetching entry count ([4880a23](https://github.com/your-commonbase/ycb-companion/commit/4880a235ffa97ca823c8dcd5d38a4b2d3e507959))
* add uploader modal for text entries in dashboard; refactor keyboard shortcuts for uploader modal activation ([1ad2f18](https://github.com/your-commonbase/ycb-companion/commit/1ad2f1883aed1c938d8dad36d43cba7dd46ce760))
* Add useRouter hook to GardenDaily page ([4ab3f9c](https://github.com/your-commonbase/ycb-companion/commit/4ab3f9c2df0ecbf76361836cabdf9f7036dfb835)), closes [#123](https://github.com/your-commonbase/ycb-companion/issues/123)
* Add viewport meta tag to improve page layout ([44cdc60](https://github.com/your-commonbase/ycb-companion/commit/44cdc607a36cd17964dd57fc144de9732bf89698))
* Disable changing key for title and author fields in Upload page ([c029f79](https://github.com/your-commonbase/ycb-companion/commit/c029f7975b17e3d6c6d4e76164acb31fbd0d9f6f))
* Display number of entries in GardenDaily component ([f1b857d](https://github.com/your-commonbase/ycb-companion/commit/f1b857d14b97d6c15dd956e80bac5d3b8baa4cde))
* Enhance EntryPage with new actions for random entry, search and uploader modals; refactor keyboard navigation logic ([7c4ba22](https://github.com/your-commonbase/ycb-companion/commit/7c4ba22ecc2d6f6baa40d5e41642122d5efcea8c))
* Enhance ForceDirectedGraph component with keyboard and touch navigation ([ccdd6a6](https://github.com/your-commonbase/ycb-companion/commit/ccdd6a6a05c1841c52aebe1b5a373f3c40fd3a17))
* Enhance ForceDirectedGraph component with modal background behavior and touch event handling ([8d14436](https://github.com/your-commonbase/ycb-companion/commit/8d14436c6bc8649a302ce3226169a0a5c9a79cdd))
* Enhance landing page content and structure, adding detailed feature descriptions and maintaining responsive design ([8a9bd06](https://github.com/your-commonbase/ycb-companion/commit/8a9bd06c3d6aa65860d4771ba02da7ac5c993a80))
* Enhance search and graph expansion with platform ID and embedding checks ([ed44b87](https://github.com/your-commonbase/ycb-companion/commit/ed44b87964cba7ed101b428b364a09f79309a8c3))
* Enhance SearchModalBeta with error handling and improved UI elements ([b579d0c](https://github.com/your-commonbase/ycb-companion/commit/b579d0caa403c959b515ec1ef53760e9f36bc7b0))
* Enhance ShareModal and Uploader components for improved sharing functionality ([ed3b8aa](https://github.com/your-commonbase/ycb-companion/commit/ed3b8aa9d16138295f6914a7e1e778c31fc4f38e))
* Enhance user interaction and modal focus across components ([54beb74](https://github.com/your-commonbase/ycb-companion/commit/54beb7432f0d5b4ca6b48b105183d6bcd6f5420e))
* Ensure aliasText is not null in Entry component ([fffedc6](https://github.com/your-commonbase/ycb-companion/commit/fffedc6ad724fb779eabf400ab11b8d0a7152dbe))
* Implement "Starred Entries" feature in dashboard with button to star/unstar entries and update translation keys accordingly ([318ac9b](https://github.com/your-commonbase/ycb-companion/commit/318ac9bda6b6032ca8115a1f85c80ff0f43ca2be))
* Implement ShareModal in EntryPage for sharing graph data ([d03e501](https://github.com/your-commonbase/ycb-companion/commit/d03e501108672bb910b19f532134e82abe94c8c3))
* Implement time machine functionality to fetch and display historical entries based on selected timeframe in SimpleDashboard ([72c4805](https://github.com/your-commonbase/ycb-companion/commit/72c4805e625d7aa8da8db0c7349258cd3bd0dd30))
* Implement token-based authentication via cookies and add random entry shortcut ([aec75f9](https://github.com/your-commonbase/ycb-companion/commit/aec75f994dde7cea97d6702e26791c860ad00c8b))
* Implement Uploader component for ShareYCB with loading state and error handling, integrating async ID processing and submission logic ([89ab6dd](https://github.com/your-commonbase/ycb-companion/commit/89ab6ddad45c448630402562c210179058ef4d15))
* Improve comment interaction and search modal functionality ([223a440](https://github.com/your-commonbase/ycb-companion/commit/223a44076962cb92f145065490bdd82d6fcaab2e))
* Include user's timezone in POST request for daily API to enhance date handling across different regions ([0f9b74b](https://github.com/your-commonbase/ycb-companion/commit/0f9b74b7d7be419c5c6d898fa988b7384418f256))
* Integrate AI features into dashboard with chat component and OpenAI API for streamlined user interaction and insights ([e449329](https://github.com/your-commonbase/ycb-companion/commit/e4493296e3705ff450aa69d7b989a28dd239412a))
* Integrate MeiliSearch for enhanced search functionality ([2a49d51](https://github.com/your-commonbase/ycb-companion/commit/2a49d517113dabde08d06208e3a0fdfe3a1aba8c))
* Integrate next-auth for authentication, adding Keycloak provider and related setup in middleware and auth configurations ([6dd8ad3](https://github.com/your-commonbase/ycb-companion/commit/6dd8ad3d330302de28f63868b903a2aefb9c8132))
* Integrate QR code functionality and enhance upload process from ShareYCB ([bd1030f](https://github.com/your-commonbase/ycb-companion/commit/bd1030f01e395177d246391d0226b140b07f4b3e))
* Optimize Entry component with memoization and lazy loading for Instagram and TikTok embeds ([f6f4a97](https://github.com/your-commonbase/ycb-companion/commit/f6f4a972168dc3dc17cb0558b112736accbd6b20))
* Optimize EntryPage and SearchResults components ([3c1e4bc](https://github.com/your-commonbase/ycb-companion/commit/3c1e4bc8012fc7f728186439a8090fd3d95693c4))
* Optimize EntryPage component with lazy loading for images ([606283a](https://github.com/your-commonbase/ycb-companion/commit/606283ab61ad95efde4c0e81c94a821bce5ff756))
* Optimize rendering of author URLs in EntryPage and SearchResults components ([07f60d4](https://github.com/your-commonbase/ycb-companion/commit/07f60d40e9495b6388b93069d522508cb6723627))
* Redesign YCB Companion's landing page with new layout and added features, streamlining navigation for better user experience ([e2d8a2e](https://github.com/your-commonbase/ycb-companion/commit/e2d8a2ee3f35cda99c61b289b6d022f830de4183))
* Refactor authentication handling to streamline NextAuth integration and improve session management with updated layouts and components ([871a7f9](https://github.com/your-commonbase/ycb-companion/commit/871a7f941bda09a6428ea77b5038bd3dc6fe3f6e))
* Refactor commit hook and update exclusions in tsconfig, improve date handling and timezone logic in GardenDaily component ([8389618](https://github.com/your-commonbase/ycb-companion/commit/838961897f2e01f520c50fc5aa72fc3f5f2716de))
* Refactor ForceDirectedGraph to improve node data handling and deduplicate links, enhancing graph rendering efficiency ([002d54a](https://github.com/your-commonbase/ycb-companion/commit/002d54a2c7e9e6665a08989bfe90328efbf307b8))
* Replace Link with button for share link, update button text for clarity, and adjust styles in ShareModalV2 component ([35fad7d](https://github.com/your-commonbase/ycb-companion/commit/35fad7df3f069509aaf43da75f65da60cea34ae4))
* Show share button conditionally in ShareModal based on entry ID validity ([8cf4f0b](https://github.com/your-commonbase/ycb-companion/commit/8cf4f0beabdc5cc28f4624c8c25e731bb0606d82))
* Simplify handleExpand function in EntryPage by removing redundant nodeGroup checks for fetching node data ([e562081](https://github.com/your-commonbase/ycb-companion/commit/e5620812dcb0451bab5feab1a9808e5598754c14))
* Update "@types/react-modal" dependency to version 3.16.3 ([9e9efde](https://github.com/your-commonbase/ycb-companion/commit/9e9efde49a6e50f93aede5c9b8b94bacab28d02b))
* Update API key in Upload component ([d61677d](https://github.com/your-commonbase/ycb-companion/commit/d61677d1f3183d58abd99917f24fcdcd02fe5023))
* Update button label to "Download Trail" in SearchResults component ([42f59e1](https://github.com/your-commonbase/ycb-companion/commit/42f59e1047b41d027646849352cf0e47b7b0ea03))
* Update Dashboard to use SimpleDashboard component and enhance ForceDirectedGraph for modal image display ([a82ef82](https://github.com/your-commonbase/ycb-companion/commit/a82ef8225413cfb20d7028b68e3fb30fcdfde6f6))
* Update font size for search input in SearchResults component ([298b330](https://github.com/your-commonbase/ycb-companion/commit/298b3309f6c749ea63d15befb49302c38d6a8265))
* Update meta title and description for the Index section in en.json to better reflect the Commonbase theme and purpose ([1a3837d](https://github.com/your-commonbase/ycb-companion/commit/1a3837d79488d4ae8849cf762902ff96cc938f63))
* Update metadata title field in Upload page ([8f4b34c](https://github.com/your-commonbase/ycb-companion/commit/8f4b34c2770a658155ee265d49e3ff8a28a62497)), closes [#123](https://github.com/your-commonbase/ycb-companion/issues/123)
* Update package dependencies ([d105730](https://github.com/your-commonbase/ycb-companion/commit/d10573012caea913a0f3152fdb1315568a57c24d))
* Update page title and add multiple YouTube video embeds to showcase features in the unauth landing page ([5737826](https://github.com/your-commonbase/ycb-companion/commit/5737826403c3cf3d2891bfefca70dfc2a0270d5e))
* Update post-commit hook to use specific Node.js version for consistent environment during commits ([1f58108](https://github.com/your-commonbase/ycb-companion/commit/1f581088c9a0579bc8847c9f349a4dbe06049025))
* Update SimpleDashboard to display entries until next journal fill ([67cab80](https://github.com/your-commonbase/ycb-companion/commit/67cab80f01009bc962dc2bff9f2fdb31a6c6027a))
* Update Uploader and Dashboard components for enhanced entry management ([5f7b08d](https://github.com/your-commonbase/ycb-companion/commit/5f7b08d8e21c199c0c93ae31d82a93182bc55e4c))
* Update viewport meta tag for better responsiveness ([ff7fde2](https://github.com/your-commonbase/ycb-companion/commit/ff7fde248d9b23ef115fac6498522e367a4c1b31))
* Update viewport meta tag for better responsiveness ([628add3](https://github.com/your-commonbase/ycb-companion/commit/628add34fde41ea5251757ee3f6e6518873a4325))

# [1.61.0](https://github.com/bramses/ycb-companion/compare/v1.60.1...v1.61.0) (2025-02-14)


### Bug Fixes

* Adjust match threshold for search API and enhance uploader functionality ([df9af1c](https://github.com/bramses/ycb-companion/commit/df9af1c3cdf6b09f03637ecb7c885345f51596a0))
* Clean up code styling and comments across components ([1e7aa4e](https://github.com/bramses/ycb-companion/commit/1e7aa4e7f20bc774f2ba2e81a301bf07899c7f4c))
* Delay input focus in dashboard and entry page for better UX during modal interactions ([bca50d9](https://github.com/bramses/ycb-companion/commit/bca50d94acfbdaae72ba28a7c88dfea8e087f388))
* Enhance API request bodies to include createdAt and improve logging for add operations in route handler ([d8ec0c2](https://github.com/bramses/ycb-companion/commit/d8ec0c2fa9ea5fe826653b91def478b101f58429))
* Prevent keyboard navigation conflicts with input elements ([923218b](https://github.com/bramses/ycb-companion/commit/923218b80777c60a409e61e343464fbf4e0af584))
* Refactor search and sharing components with various improvements ([7350cf8](https://github.com/bramses/ycb-companion/commit/7350cf802147fb4b8837f564047bc70a69920a5b))
* Refine comment handling and graph interaction ([1f52b4b](https://github.com/bramses/ycb-companion/commit/1f52b4bd11878450f820112d97a61c3a4ae673ca))
* Update Uploader API endpoint to use production URL and adjust textarea font size for improved readability ([1f6aefb](https://github.com/bramses/ycb-companion/commit/1f6aefb91b7c953e5d0994143c70e4b6a1d4e38e))


### Features

* Add 'he' library for HTML entity decoding in title and description processing, and update package dependencies accordingly ([013eca0](https://github.com/bramses/ycb-companion/commit/013eca0bd91fd6b959b215ea41d3485ad76bb0ba))
* Add 'r' key shortcut to open a random entry in DashboardLayout and refactor related functionality in EntryPage and SimpleDashboard ([3f98e62](https://github.com/bramses/ycb-companion/commit/3f98e622627ead0e4bca79647f7074cf7801d296))
* Add commit-hook.js to .gitignore to exclude local commit hooks from version control ([f319d22](https://github.com/bramses/ycb-companion/commit/f319d2280f407f0e8014f106ed815d7900d0f3e6))
* Add node-fetch v3.3.2 to package dependencies, enhance Dashboard layout with share functionality and modal integration ([a9971ec](https://github.com/bramses/ycb-companion/commit/a9971ec2f49a2af2769359387a7fe028d1524958))
* Add node-html-parser dependency and enhance Uploader with new props for text, title, and author defaults in various components ([d13964d](https://github.com/bramses/ycb-companion/commit/d13964d072e72f67bedaed24d0b0ee1b694e7241))
* Add OIDC client libraries and refactor auth components for improved user authentication flow in the application ([cc21eb2](https://github.com/bramses/ycb-companion/commit/cc21eb2dfd69712817c8153f591b0859a29b63a9))
* Add title generation feature with API integration and button in Uploader component for enhanced user experience ([81325f0](https://github.com/bramses/ycb-companion/commit/81325f01be43b5031a1ef7031523f7ba97075a67))
* add uploader modal for text entries in dashboard; refactor keyboard shortcuts for uploader modal activation ([1ad2f18](https://github.com/bramses/ycb-companion/commit/1ad2f1883aed1c938d8dad36d43cba7dd46ce760))
* Enhance EntryPage with new actions for random entry, search and uploader modals; refactor keyboard navigation logic ([7c4ba22](https://github.com/bramses/ycb-companion/commit/7c4ba22ecc2d6f6baa40d5e41642122d5efcea8c))
* Enhance landing page content and structure, adding detailed feature descriptions and maintaining responsive design ([8a9bd06](https://github.com/bramses/ycb-companion/commit/8a9bd06c3d6aa65860d4771ba02da7ac5c993a80))
* Enhance search and graph expansion with platform ID and embedding checks ([ed44b87](https://github.com/bramses/ycb-companion/commit/ed44b87964cba7ed101b428b364a09f79309a8c3))
* Enhance user interaction and modal focus across components ([54beb74](https://github.com/bramses/ycb-companion/commit/54beb7432f0d5b4ca6b48b105183d6bcd6f5420e))
* Implement token-based authentication via cookies and add random entry shortcut ([aec75f9](https://github.com/bramses/ycb-companion/commit/aec75f994dde7cea97d6702e26791c860ad00c8b))
* Implement Uploader component for ShareYCB with loading state and error handling, integrating async ID processing and submission logic ([89ab6dd](https://github.com/bramses/ycb-companion/commit/89ab6ddad45c448630402562c210179058ef4d15))
* Improve comment interaction and search modal functionality ([223a440](https://github.com/bramses/ycb-companion/commit/223a44076962cb92f145065490bdd82d6fcaab2e))
* Include user's timezone in POST request for daily API to enhance date handling across different regions ([0f9b74b](https://github.com/bramses/ycb-companion/commit/0f9b74b7d7be419c5c6d898fa988b7384418f256))
* Integrate next-auth for authentication, adding Keycloak provider and related setup in middleware and auth configurations ([6dd8ad3](https://github.com/bramses/ycb-companion/commit/6dd8ad3d330302de28f63868b903a2aefb9c8132))
* Integrate QR code functionality and enhance upload process from ShareYCB ([bd1030f](https://github.com/bramses/ycb-companion/commit/bd1030f01e395177d246391d0226b140b07f4b3e))
* Redesign YCB Companion's landing page with new layout and added features, streamlining navigation for better user experience ([e2d8a2e](https://github.com/bramses/ycb-companion/commit/e2d8a2ee3f35cda99c61b289b6d022f830de4183))
* Refactor authentication handling to streamline NextAuth integration and improve session management with updated layouts and components ([871a7f9](https://github.com/bramses/ycb-companion/commit/871a7f941bda09a6428ea77b5038bd3dc6fe3f6e))
* Refactor commit hook and update exclusions in tsconfig, improve date handling and timezone logic in GardenDaily component ([8389618](https://github.com/bramses/ycb-companion/commit/838961897f2e01f520c50fc5aa72fc3f5f2716de))
* Replace Link with button for share link, update button text for clarity, and adjust styles in ShareModalV2 component ([35fad7d](https://github.com/bramses/ycb-companion/commit/35fad7df3f069509aaf43da75f65da60cea34ae4))
* Update meta title and description for the Index section in en.json to better reflect the Commonbase theme and purpose ([1a3837d](https://github.com/bramses/ycb-companion/commit/1a3837d79488d4ae8849cf762902ff96cc938f63))
* Update page title and add multiple YouTube video embeds to showcase features in the unauth landing page ([5737826](https://github.com/bramses/ycb-companion/commit/5737826403c3cf3d2891bfefca70dfc2a0270d5e))
* Update post-commit hook to use specific Node.js version for consistent environment during commits ([1f58108](https://github.com/bramses/ycb-companion/commit/1f581088c9a0579bc8847c9f349a4dbe06049025))

## [1.60.1](https://github.com/bramses/ycb-companion/compare/v1.60.0...v1.60.1) (2025-01-13)


### Bug Fixes

* Correct parent image reference to use item image in ForceDirectedGraph component for accurate rendering ([0c300aa](https://github.com/bramses/ycb-companion/commit/0c300aadb29b93c0a5e663583e63abcde4dc6c08))

# [1.60.0](https://github.com/bramses/ycb-companion/compare/v1.59.0...v1.60.0) (2025-01-13)


### Features

* Simplify handleExpand function in EntryPage by removing redundant nodeGroup checks for fetching node data ([e562081](https://github.com/bramses/ycb-companion/commit/e5620812dcb0451bab5feab1a9808e5598754c14))

# [1.59.0](https://github.com/bramses/ycb-companion/compare/v1.58.0...v1.59.0) (2025-01-13)


### Features

* Refactor ForceDirectedGraph to improve node data handling and deduplicate links, enhancing graph rendering efficiency ([002d54a](https://github.com/bramses/ycb-companion/commit/002d54a2c7e9e6665a08989bfe90328efbf307b8))

# [1.58.0](https://github.com/bramses/ycb-companion/compare/v1.57.0...v1.58.0) (2025-01-11)


### Features

* Add navigation instructions to EntryPage component ([9b62276](https://github.com/bramses/ycb-companion/commit/9b62276f5900933c10403dfffb900a6c245514c8))

# [1.57.0](https://github.com/bramses/ycb-companion/compare/v1.56.0...v1.57.0) (2025-01-11)


### Features

* Enhance ForceDirectedGraph component with modal background behavior and touch event handling ([8d14436](https://github.com/bramses/ycb-companion/commit/8d14436c6bc8649a302ce3226169a0a5c9a79cdd))

# [1.56.0](https://github.com/bramses/ycb-companion/compare/v1.55.0...v1.56.0) (2025-01-11)


### Features

* Enhance ForceDirectedGraph component with keyboard and touch navigation ([ccdd6a6](https://github.com/bramses/ycb-companion/commit/ccdd6a6a05c1841c52aebe1b5a373f3c40fd3a17))

# [1.55.0](https://github.com/bramses/ycb-companion/compare/v1.54.0...v1.55.0) (2025-01-11)


### Features

* Update SimpleDashboard to display entries until next journal fill ([67cab80](https://github.com/bramses/ycb-companion/commit/67cab80f01009bc962dc2bff9f2fdb31a6c6027a))

# [1.54.0](https://github.com/bramses/ycb-companion/compare/v1.53.2...v1.54.0) (2025-01-10)


### Features

* Add total entries count to SimpleDashboard and implement API for fetching entry count ([4880a23](https://github.com/bramses/ycb-companion/commit/4880a235ffa97ca823c8dcd5d38a4b2d3e507959))

## [1.53.2](https://github.com/bramses/ycb-companion/compare/v1.53.1...v1.53.2) (2025-01-10)


### Bug Fixes

* Enhance SearchModalBeta with token management and error handling ([79fbe89](https://github.com/bramses/ycb-companion/commit/79fbe8971f7f85168969ca70c4896596f67b3889))

## [1.53.1](https://github.com/bramses/ycb-companion/compare/v1.53.0...v1.53.1) (2025-01-08)


### Bug Fixes

* Improve layout in SearchModalBeta component for better text handling ([f8f2182](https://github.com/bramses/ycb-companion/commit/f8f2182ad1d21f65f07c836609d4610edf7608af))
* Update MeiliSearch host environment variable in SearchModalBeta component ([be8f288](https://github.com/bramses/ycb-companion/commit/be8f2883e920729bb6aae6c578063052bdb4dc4a))

# [1.53.0](https://github.com/bramses/ycb-companion/compare/v1.52.0...v1.53.0) (2025-01-08)


### Features

* Enhance SearchModalBeta with error handling and improved UI elements ([b579d0c](https://github.com/bramses/ycb-companion/commit/b579d0caa403c959b515ec1ef53760e9f36bc7b0))
* Integrate MeiliSearch for enhanced search functionality ([2a49d51](https://github.com/bramses/ycb-companion/commit/2a49d517113dabde08d06208e3a0fdfe3a1aba8c))

# [1.52.0](https://github.com/bramses/ycb-companion/compare/v1.51.0...v1.52.0) (2024-12-23)


### Features

* Add base64 image conversion in ShareModal for JSON export ([8799f60](https://github.com/bramses/ycb-companion/commit/8799f6017a1d307905b018f3ed5404f6ee16812f))
* Enhance ShareModal and Uploader components for improved sharing functionality ([ed3b8aa](https://github.com/bramses/ycb-companion/commit/ed3b8aa9d16138295f6914a7e1e778c31fc4f38e))
* Implement ShareModal in EntryPage for sharing graph data ([d03e501](https://github.com/bramses/ycb-companion/commit/d03e501108672bb910b19f532134e82abe94c8c3))
* Show share button conditionally in ShareModal based on entry ID validity ([8cf4f0b](https://github.com/bramses/ycb-companion/commit/8cf4f0beabdc5cc28f4624c8c25e731bb0606d82))
* Update Uploader and Dashboard components for enhanced entry management ([5f7b08d](https://github.com/bramses/ycb-companion/commit/5f7b08d8e21c199c0c93ae31d82a93182bc55e4c))

# [1.51.0](https://github.com/bramses/ycb-companion/compare/v1.50.0...v1.51.0) (2024-12-17)


### Features

* Add Flow link to DashboardLayout and integrate loading states in CallAndResponse for better user experience ([aa938d7](https://github.com/bramses/ycb-companion/commit/aa938d7f1d6fb591e373f8f7be2f267140688c34))

# [1.50.0](https://github.com/bramses/ycb-companion/compare/v1.49.0...v1.50.0) (2024-12-16)


### Features

* Add Flow Sessions page and API for managing past flow states in the dashboard, enhancing user navigation and data access ([1618d3e](https://github.com/bramses/ycb-companion/commit/1618d3eac8068ad4d58079bf3f29ad9b44d964f4))

# [1.49.0](https://github.com/bramses/ycb-companion/compare/v1.48.0...v1.49.0) (2024-11-15)


### Features

* Add functionality to fetch and display random time machine entries in SimpleDashboard with a new button for user interaction ([9886b9d](https://github.com/bramses/ycb-companion/commit/9886b9d9037470d93d0ded2608fcae4e235ab2b6))

# [1.48.0](https://github.com/bramses/ycb-companion/compare/v1.47.0...v1.48.0) (2024-11-15)


### Features

* Implement time machine functionality to fetch and display historical entries based on selected timeframe in SimpleDashboard ([72c4805](https://github.com/bramses/ycb-companion/commit/72c4805e625d7aa8da8db0c7349258cd3bd0dd30))

# [1.47.0](https://github.com/bramses/ycb-companion/compare/v1.46.0...v1.47.0) (2024-11-14)


### Features

* Add custom link component in Chat for improved Markdown link rendering and better user experience ([7cbc174](https://github.com/bramses/ycb-companion/commit/7cbc174eee14d3c6e9af9eecdf05b02946a3d06d))

# [1.46.0](https://github.com/bramses/ycb-companion/compare/v1.45.4...v1.46.0) (2024-11-14)


### Features

* Integrate AI features into dashboard with chat component and OpenAI API for streamlined user interaction and insights ([e449329](https://github.com/bramses/ycb-companion/commit/e4493296e3705ff450aa69d7b989a28dd239412a))

## [1.45.4](https://github.com/bramses/ycb-companion/compare/v1.45.3...v1.45.4) (2024-11-07)


### Bug Fixes

* Ensure window reload is called after saving changes in EntryPage component ([f961e32](https://github.com/bramses/ycb-companion/commit/f961e322a1d0c7b449a6f6a4bae81aa18c026c19))

## [1.45.3](https://github.com/bramses/ycb-companion/compare/v1.45.2...v1.45.3) (2024-11-07)


### Bug Fixes

* Remove unnecessary window reload in EntryPage component ([9f45a43](https://github.com/bramses/ycb-companion/commit/9f45a436d3308b2c9112ab547bd71e6f04c4ce8c))

## [1.45.2](https://github.com/bramses/ycb-companion/compare/v1.45.1...v1.45.2) (2024-11-07)


### Bug Fixes

* Update comments prop name to inputComments in ForceFromEntry component in SimpleDashboard ([2045b60](https://github.com/bramses/ycb-companion/commit/2045b60746512246fc311a64392ec9fc69f48f2f))

## [1.45.1](https://github.com/bramses/ycb-companion/compare/v1.45.0...v1.45.1) (2024-11-06)


### Bug Fixes

* Correctly update comments prop name in ForceFromEntry component and tidy up modal content structure in ForceDirectedGraph component ([7e8f92e](https://github.com/bramses/ycb-companion/commit/7e8f92e8830bb093e228423cd9e1c2843bee7eea))

# [1.45.0](https://github.com/bramses/ycb-companion/compare/v1.44.1...v1.45.0) (2024-11-06)


### Features

* Add cachedFData state to EntryPage component ([3999d0c](https://github.com/bramses/ycb-companion/commit/3999d0ca4b9c21dd6cd31ef6da32935bb6fdcca0))

## [1.44.1](https://github.com/bramses/ycb-companion/compare/v1.44.0...v1.44.1) (2024-11-06)


### Bug Fixes

* Update Inbox component to fetch entries on page change and set document title for improved user experience ([efcb312](https://github.com/bramses/ycb-companion/commit/efcb312f9602686b2c5d9814b7910fd5eb000418))

# [1.44.0](https://github.com/bramses/ycb-companion/compare/v1.43.5...v1.44.0) (2024-11-06)


### Features

* Update Dashboard to use SimpleDashboard component and enhance ForceDirectedGraph for modal image display ([a82ef82](https://github.com/bramses/ycb-companion/commit/a82ef8225413cfb20d7028b68e3fb30fcdfde6f6))

## [1.43.5](https://github.com/bramses/ycb-companion/compare/v1.43.4...v1.43.5) (2024-11-02)


### Bug Fixes

* Refactor EntryPage state management for neighbor, comment, and internal link processing with better clarity and incremental updates ([a2ac207](https://github.com/bramses/ycb-companion/commit/a2ac2077df1ce8da5182fa546aa282f53bc20538))

## [1.43.4](https://github.com/bramses/ycb-companion/compare/v1.43.3...v1.43.4) (2024-10-30)


### Bug Fixes

* Add matchCount functionality to search route and enhance EntryPage for internal links and penPals clarity ([733b7ed](https://github.com/bramses/ycb-companion/commit/733b7ed216520bdc3057b5d2fbc7d648fd519ea9))

## [1.43.3](https://github.com/bramses/ycb-companion/compare/v1.43.2...v1.43.3) (2024-10-26)


### Bug Fixes

* Improve code clarity by formatting, cleaning up comments, and restructuring async function in EntryPage component ([98b57b0](https://github.com/bramses/ycb-companion/commit/98b57b0736638126e04b103ace8dd32720d4c7f0))

## [1.43.2](https://github.com/bramses/ycb-companion/compare/v1.43.1...v1.43.2) (2024-10-26)


### Bug Fixes

* Simplify event handling by removing unused parameter in click event for ForceDirectedGraph component ([9468116](https://github.com/bramses/ycb-companion/commit/9468116da6c6f5384c86d16c6cafdc7a0030b84f))

## [1.43.1](https://github.com/bramses/ycb-companion/compare/v1.43.0...v1.43.1) (2024-10-26)


### Bug Fixes

* Remove unnecessary index parameter in flatMap for clearer code in ForceDirectedGraph component ([e17a4a2](https://github.com/bramses/ycb-companion/commit/e17a4a2ef3bacc799371774ed6917f4971917191))

# [1.43.0](https://github.com/bramses/ycb-companion/compare/v1.42.2...v1.43.0) (2024-10-26)


### Features

* Add D3.js and related types for visualizing data with a Force Directed Graph component in EntryPage ([7c3bef7](https://github.com/bramses/ycb-companion/commit/7c3bef716c1970752b8cfe7cfd24114e946e3160))

## [1.42.2](https://github.com/bramses/ycb-companion/compare/v1.42.1...v1.42.2) (2024-10-23)


### Bug Fixes

* Improve formatting and reorganize imports in Inbox component for better readability and consistency ([1487055](https://github.com/bramses/ycb-companion/commit/148705512da4b2486b6934d95a31e9fcc5788ee9))

## [1.42.1](https://github.com/bramses/ycb-companion/compare/v1.42.0...v1.42.1) (2024-10-23)


### Bug Fixes

* Correct rendering of inbox count in dashboard layout for improved display clarity ([882c7e7](https://github.com/bramses/ycb-companion/commit/882c7e7a45797f1bd9471b20e30882c500f907e6))

# [1.42.0](https://github.com/bramses/ycb-companion/compare/v1.41.0...v1.42.0) (2024-10-23)


### Features

* Add inbox feature to dashboard with count and fetch functionality, including new translations for the inbox link ([92652eb](https://github.com/bramses/ycb-companion/commit/92652eb51fdb59af7c5fd0f3bdea2449e73d1937))

# [1.41.0](https://github.com/bramses/ycb-companion/compare/v1.40.3...v1.41.0) (2024-10-22)


### Features

* Implement "Starred Entries" feature in dashboard with button to star/unstar entries and update translation keys accordingly ([318ac9b](https://github.com/bramses/ycb-companion/commit/318ac9bda6b6032ca8115a1f85c80ff0f43ca2be))

## [1.40.3](https://github.com/bramses/ycb-companion/compare/v1.40.2...v1.40.3) (2024-10-21)


### Bug Fixes

* Remove unnecessary logging in auth API fetch route and refine metadata query replacement in search route ([e102ded](https://github.com/bramses/ycb-companion/commit/e102dedd206c0d6b49858bc9556069e85b4ca3ea))

## [1.40.2](https://github.com/bramses/ycb-companion/compare/v1.40.1...v1.40.2) (2024-10-21)


### Bug Fixes

* Remove old NotFoundPage from src/app and migrate it to locale-specific directory ([6f15c33](https://github.com/bramses/ycb-companion/commit/6f15c33114bf21c4302a14eb264746f9e110373f))

## [1.40.1](https://github.com/bramses/ycb-companion/compare/v1.40.0...v1.40.1) (2024-10-21)


### Bug Fixes

* Update EntryPage to process alias data with custom markdown handling for improved rendering ([d88c2e1](https://github.com/bramses/ycb-companion/commit/d88c2e1d5e699fda57232181c4255bb0e391faa6))

# [1.40.0](https://github.com/bramses/ycb-companion/compare/v1.39.0...v1.40.0) (2024-10-21)


### Features

* Add NotFoundPage component to display a friendly message for 404 errors in the application ([9f8cce6](https://github.com/bramses/ycb-companion/commit/9f8cce65b3f17e56392d0cf2f226742bc02ecae1))

# [1.39.0](https://github.com/bramses/ycb-companion/compare/v1.38.1...v1.39.0) (2024-09-08)


### Features

* Add splitIntoWords function for truncating search result text ([c598067](https://github.com/bramses/ycb-companion/commit/c5980675da6c7153332cc96bd8f550582aaf5426))

## [1.38.1](https://github.com/bramses/ycb-companion/compare/v1.38.0...v1.38.1) (2024-09-07)


### Bug Fixes

* Update author URL rendering in EntryPage component ([4bcf2ce](https://github.com/bramses/ycb-companion/commit/4bcf2ce60f25bbf1e3dd96182e39329eac6268e4))

# [1.38.0](https://github.com/bramses/ycb-companion/compare/v1.37.0...v1.38.0) (2024-09-07)


### Features

* Update button label to "Download Trail" in SearchResults component ([42f59e1](https://github.com/bramses/ycb-companion/commit/42f59e1047b41d027646849352cf0e47b7b0ea03))

# [1.37.0](https://github.com/bramses/ycb-companion/compare/v1.36.0...v1.37.0) (2024-09-05)


### Features

* Optimize rendering of author URLs in EntryPage and SearchResults components ([07f60d4](https://github.com/bramses/ycb-companion/commit/07f60d40e9495b6388b93069d522508cb6723627))

# [1.36.0](https://github.com/bramses/ycb-companion/compare/v1.35.0...v1.36.0) (2024-09-03)


### Features

* Optimize EntryPage and SearchResults components ([3c1e4bc](https://github.com/bramses/ycb-companion/commit/3c1e4bc8012fc7f728186439a8090fd3d95693c4))

# [1.35.0](https://github.com/bramses/ycb-companion/compare/v1.34.0...v1.35.0) (2024-09-03)


### Features

* Update font size for search input in SearchResults component ([298b330](https://github.com/bramses/ycb-companion/commit/298b3309f6c749ea63d15befb49302c38d6a8265))

# [1.34.0](https://github.com/bramses/ycb-companion/compare/v1.33.0...v1.34.0) (2024-09-03)


### Features

* Update viewport meta tag for better responsiveness ([ff7fde2](https://github.com/bramses/ycb-companion/commit/ff7fde248d9b23ef115fac6498522e367a4c1b31))

# [1.33.0](https://github.com/bramses/ycb-companion/compare/v1.32.0...v1.33.0) (2024-09-03)


### Features

* Update viewport meta tag for better responsiveness ([628add3](https://github.com/bramses/ycb-companion/commit/628add34fde41ea5251757ee3f6e6518873a4325))

# [1.32.0](https://github.com/bramses/ycb-companion/compare/v1.31.0...v1.32.0) (2024-09-03)


### Features

* Add search functionality to EntryPage ([2b8027d](https://github.com/bramses/ycb-companion/commit/2b8027da61cacf48053a1d1df9f97b8b360da8db))

# [1.31.0](https://github.com/bramses/ycb-companion/compare/v1.30.0...v1.31.0) (2024-09-03)


### Features

* Optimize EntryPage component with lazy loading for images ([606283a](https://github.com/bramses/ycb-companion/commit/606283ab61ad95efde4c0e81c94a821bce5ff756))

# [1.30.0](https://github.com/bramses/ycb-companion/compare/v1.29.0...v1.30.0) (2024-08-30)


### Features

* Update "@types/react-modal" dependency to version 3.16.3 ([9e9efde](https://github.com/bramses/ycb-companion/commit/9e9efde49a6e50f93aede5c9b8b94bacab28d02b))

# [1.29.0](https://github.com/bramses/ycb-companion/compare/v1.28.0...v1.29.0) (2024-08-30)


### Features

* Update package dependencies ([d105730](https://github.com/bramses/ycb-companion/commit/d10573012caea913a0f3152fdb1315568a57c24d))

# [1.28.0](https://github.com/bramses/ycb-companion/compare/v1.27.0...v1.28.0) (2024-08-29)


### Features

* Add date selection to GardenDaily component ([e9b9f44](https://github.com/bramses/ycb-companion/commit/e9b9f447bdee310d126d20ae19a8d31ed3903b0b))
* Optimize Entry component with memoization and lazy loading for Instagram and TikTok embeds ([f6f4a97](https://github.com/bramses/ycb-companion/commit/f6f4a972168dc3dc17cb0558b112736accbd6b20))

# [1.27.0](https://github.com/bramses/ycb-companion/compare/v1.26.0...v1.27.0) (2024-08-29)


### Features

* Add onEdit function to Entries component ([c9c95df](https://github.com/bramses/ycb-companion/commit/c9c95df213087a85f7b4ad1737bd76d54ff17772))

# [1.26.0](https://github.com/bramses/ycb-companion/compare/v1.25.0...v1.26.0) (2024-08-29)


### Features

* Add onEdit function to Entries component ([2733ca0](https://github.com/bramses/ycb-companion/commit/2733ca01bf85bc18d8831451b78fb0574ab6dcad))

# [1.25.0](https://github.com/bramses/ycb-companion/compare/v1.24.0...v1.25.0) (2024-08-28)


### Features

* Add onKeyDown event listener to text area in Upload page ([94bc9e3](https://github.com/bramses/ycb-companion/commit/94bc9e31b293eeb4018a156b612a02cec7e5f7e4))

# [1.24.0](https://github.com/bramses/ycb-companion/compare/v1.23.0...v1.24.0) (2024-08-28)


### Features

* Add onKeyDown event listener to text area in Upload page ([6e95552](https://github.com/bramses/ycb-companion/commit/6e95552548bef7179cbf5b292175ebb7878e48ea))

# [1.23.0](https://github.com/bramses/ycb-companion/compare/v1.22.0...v1.23.0) (2024-08-28)


### Features

* Add onKeyDown event listener to text area in Upload page ([af79fc2](https://github.com/bramses/ycb-companion/commit/af79fc2444012040177e5935fec00beb769ff241))

# [1.22.0](https://github.com/bramses/ycb-companion/compare/v1.21.0...v1.22.0) (2024-08-28)


### Features

* Add react-calendar CSS import to GardenDaily page ([db194eb](https://github.com/bramses/ycb-companion/commit/db194eb9a7e3d6a26c6f80985dc6cc4ca30f418a))

# [1.21.0](https://github.com/bramses/ycb-companion/compare/v1.20.0...v1.21.0) (2024-08-28)


### Features

* Disable changing key for title and author fields in Upload page ([c029f79](https://github.com/bramses/ycb-companion/commit/c029f7975b17e3d6c6d4e76164acb31fbd0d9f6f))

# [1.20.0](https://github.com/bramses/ycb-companion/compare/v1.19.0...v1.20.0) (2024-08-27)


### Features

* Ensure aliasText is not null in Entry component ([fffedc6](https://github.com/bramses/ycb-companion/commit/fffedc6ad724fb779eabf400ab11b8d0a7152dbe))

# [1.19.0](https://github.com/bramses/ycb-companion/compare/v1.18.0...v1.19.0) (2024-08-27)


### Features

* Add feedback link to BaseTemplate and implement sticky behavior for SearchBox ([7b9b6be](https://github.com/bramses/ycb-companion/commit/7b9b6be8dcc45d6695d21272fc33620275bab380))

# [1.18.0](https://github.com/bramses/ycb-companion/compare/v1.17.0...v1.18.0) (2024-08-26)


### Features

* Add useRouter hook to GardenDaily page ([4ab3f9c](https://github.com/bramses/ycb-companion/commit/4ab3f9c2df0ecbf76361836cabdf9f7036dfb835)), closes [#123](https://github.com/bramses/ycb-companion/issues/123)

# [1.17.0](https://github.com/bramses/ycb-companion/compare/v1.16.0...v1.17.0) (2024-08-26)


### Features

* Add support for Instagram and TikTok embeds in Garden page ([4b1e3df](https://github.com/bramses/ycb-companion/commit/4b1e3dfa4bfa1fcba42137a8c0b9787c9c1a6b84)), closes [#123](https://github.com/bramses/ycb-companion/issues/123)

# [1.16.0](https://github.com/bramses/ycb-companion/compare/v1.15.0...v1.16.0) (2024-08-25)


### Features

* Update metadata title field in Upload page ([8f4b34c](https://github.com/bramses/ycb-companion/commit/8f4b34c2770a658155ee265d49e3ff8a28a62497)), closes [#123](https://github.com/bramses/ycb-companion/issues/123)

# [1.15.0](https://github.com/bramses/ycb-companion/compare/v1.14.0...v1.15.0) (2024-08-24)


### Features

* Add API_KEY to fetch and list routes for authentication ([41d27ef](https://github.com/bramses/ycb-companion/commit/41d27efbb5d75285838435caf862825d6e43c2ea))

# [1.14.0](https://github.com/bramses/ycb-companion/compare/v1.13.0...v1.14.0) (2024-08-23)


### Features

* Add API_KEY to search route for authentication ([2acd00a](https://github.com/bramses/ycb-companion/commit/2acd00ac02c696f07c711f6750ee1a8849d91e2f))

# [1.13.0](https://github.com/bramses/ycb-companion/compare/v1.12.0...v1.13.0) (2024-08-20)


### Features

* Add onAddToCollection function to Entries component ([1655d85](https://github.com/bramses/ycb-companion/commit/1655d850125c776f8798c511178e394723955b1d))

# [1.12.0](https://github.com/bramses/ycb-companion/compare/v1.11.0...v1.12.0) (2024-08-19)


### Features

* Add cellEditorParams to Grid component for limiting text length ([8a9b96d](https://github.com/bramses/ycb-companion/commit/8a9b96d10bfea6a153e8f6d64be5caee54eef450))

# [1.11.0](https://github.com/bramses/ycb-companion/compare/v1.10.0...v1.11.0) (2024-08-19)


### Features

* Add "Create Upload w/ ChatGPT" link to upload page ([8156668](https://github.com/bramses/ycb-companion/commit/815666862ebbc7953ec77d8635f69fd2f5c78880))

# [1.10.0](https://github.com/bramses/ycb-companion/compare/v1.9.0...v1.10.0) (2024-08-19)


### Features

* Add ag-grid-community dependency for grid functionality ([9f62524](https://github.com/bramses/ycb-companion/commit/9f625247aedb0626f855a27a01c90494d6f551b0))

# [1.9.0](https://github.com/bramses/ycb-companion/compare/v1.8.0...v1.9.0) (2024-08-19)


### Features

* Add ag-grid-react dependency for grid functionality ([b1ad92b](https://github.com/bramses/ycb-companion/commit/b1ad92b629c041d6fe27c3935758ea1975890282))

# [1.8.0](https://github.com/bramses/ycb-companion/compare/v1.7.0...v1.8.0) (2024-08-18)


### Features

* Add viewport meta tag to improve page layout ([44cdc60](https://github.com/bramses/ycb-companion/commit/44cdc607a36cd17964dd57fc144de9732bf89698))

# [1.7.0](https://github.com/bramses/ycb-companion/compare/v1.6.1...v1.7.0) (2024-08-17)


### Features

* Display number of entries in GardenDaily component ([f1b857d](https://github.com/bramses/ycb-companion/commit/f1b857d14b97d6c15dd956e80bac5d3b8baa4cde))

## [1.6.1](https://github.com/bramses/ycb-companion/compare/v1.6.0...v1.6.1) (2024-08-17)


### Bug Fixes

* Return entry object instead of an empty array in catch block ([041513e](https://github.com/bramses/ycb-companion/commit/041513eaca93639bfe49e51fedbfd9e30892b672))

# [1.6.0](https://github.com/bramses/ycb-companion/compare/v1.5.0...v1.6.0) (2024-08-17)


### Features

* Add "Garden" link to the dashboard navigation ([4380462](https://github.com/bramses/ycb-companion/commit/4380462e31fa020bddeb4055c9528e2db1aba80d))

# [1.5.0](https://github.com/bramses/ycb-companion/compare/v1.4.0...v1.5.0) (2024-08-17)


### Features

* Add button to call /api/random and populate textarea ([b96082d](https://github.com/bramses/ycb-companion/commit/b96082d44516e8ddc20c64b797735c5c9dd624c2))

# [1.4.0](https://github.com/bramses/ycb-companion/compare/v1.3.0...v1.4.0) (2024-08-17)


### Features

* Update API key in Upload component ([d61677d](https://github.com/bramses/ycb-companion/commit/d61677d1f3183d58abd99917f24fcdcd02fe5023))

# [1.3.0](https://github.com/bramses/ycb-companion/compare/v1.2.0...v1.3.0) (2024-08-16)


### Features

* Add loading state during file upload in Upload component ([b33acc7](https://github.com/bramses/ycb-companion/commit/b33acc7dec80a29568a205ab0afd779fd77da499))

# [1.2.0](https://github.com/bramses/ycb-companion/compare/v1.1.0...v1.2.0) (2024-08-16)


### Features

* Add image upload functionality and description retrieval ([c9c1642](https://github.com/bramses/ycb-companion/commit/c9c164279c859bb082927279a5e97e707cfed059))

# [1.1.0](https://github.com/bramses/ycb-companion/compare/v1.0.0...v1.1.0) (2024-08-16)


### Features

* Add ReactMarkdown dependency and render data in Entry component ([ca48573](https://github.com/bramses/ycb-companion/commit/ca48573aa4544ab8f61dec8d77d061a5c54f3be8))

# 1.0.0 (2024-08-15)


### Bug Fixes

* Clear alias input field after adding alias in Entry component ([f04c460](https://github.com/bramses/ycb-companion/commit/f04c4609e0a71dcef384fb251d25b20cbe7f22ec))

# [3.54.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.53.0...v3.54.0) (2024-07-23)


### Features

* add NODE_ENV in t3 env ([17c23f9](https://github.com/ixartz/Next-js-Boilerplate/commit/17c23f9bea037da9ab2ae93b9ecc883a919d9723))
* add Sentry configuration in environment files and fix meta journal error in production ([2243510](https://github.com/ixartz/Next-js-Boilerplate/commit/2243510438d8b4e0670a309605852c817a6d8492))
* enable static rendering with i18n ([e6ec268](https://github.com/ixartz/Next-js-Boilerplate/commit/e6ec2682de7d8a5f1b92be67f1fa1499f800f624))
* middlware should not run for monitoring endpoint ([34b3c0c](https://github.com/ixartz/Next-js-Boilerplate/commit/34b3c0cb2cd732f937755e950197f03c765bdd15))
* use defineConfig in drizzle.config.ts ([48893e5](https://github.com/ixartz/Next-js-Boilerplate/commit/48893e535bb4889dd83c97aa809a6081b1e9afbd))

# [3.53.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.52.0...v3.53.0) (2024-06-26)


### Features

* add updateAt and createdAt attribute in guestbook ([80d369a](https://github.com/ixartz/Next-js-Boilerplate/commit/80d369a9d374cb5557356d9ea794719e3a1f59d5))
* create a new environement file for production ([988a051](https://github.com/ixartz/Next-js-Boilerplate/commit/988a051515666e7698a42f066198e7eb8dd44f32))
* switch to Postgres in Drizzle ORM ([1d725e8](https://github.com/ixartz/Next-js-Boilerplate/commit/1d725e8d280e1848e792aba7c8102371b3c038a8))

# [3.52.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.51.0...v3.52.0) (2024-05-31)


### Features

* update Drizzle configuration for Drizzle Kit 0.22 and improve ([5159455](https://github.com/ixartz/Next-js-Boilerplate/commit/5159455ab2cfb569702b33a7e2135ec23f32d598))

# [3.51.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.50.1...v3.51.0) (2024-05-29)


### Features

* update to Drizzle kit 0.21 version, no need to have dialect in command line ([62aa678](https://github.com/ixartz/Next-js-Boilerplate/commit/62aa6786117637e6b76c97f6c98f7ca6e8c343b0))

## [3.50.1](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.50.0...v3.50.1) (2024-05-20)


### Bug Fixes

* add eslint support for .mts file ([cd58d38](https://github.com/ixartz/Next-js-Boilerplate/commit/cd58d3806206e269d712e0976f4101af26275e44))

# [3.50.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.49.0...v3.50.0) (2024-05-18)


### Features

* replace Jest by Vitest for better DX ([2504504](https://github.com/ixartz/Next-js-Boilerplate/commit/25045041bb0af1fc4065ccffdb4d4d9b715c5823))
* update to Storybook v8 ([51b20a6](https://github.com/ixartz/Next-js-Boilerplate/commit/51b20a64f8f7a9780cb4c81b6ec2f0d1ac8779c5))


### Reverts

* reuse vitest.config.mts to avoid warning when running the tests ([f923242](https://github.com/ixartz/Next-js-Boilerplate/commit/f9232425d3cca895bcf3b45355dbee2caaedccce))

# [3.49.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.48.0...v3.49.0) (2024-05-17)


### Features

* vscode jest open test result view on test fails and add unauthenticatedUrl in clerk middleware ([2a68124](https://github.com/ixartz/Next-js-Boilerplate/commit/2a681244f834b6ea55bcd5cd3105f8b4a9df4a05))

# [3.48.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.47.0...v3.48.0) (2024-05-09)


### Features

* add custom configuration for i18n ally VSCode extension ([46f9459](https://github.com/ixartz/Next-js-Boilerplate/commit/46f945963c02eb29efc802fb0f3b1220b10bdf13))

# [3.47.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.46.0...v3.47.0) (2024-05-07)


### Features

* make dashboard without lang protected route in Clerk ([704466b](https://github.com/ixartz/Next-js-Boilerplate/commit/704466bbab40e366d0c1e17b66d7f5f0e97b902b))
* run Clerk middleware only needed ([5aeee06](https://github.com/ixartz/Next-js-Boilerplate/commit/5aeee0609bb9abbccf17aa0d2900cffdc7c3a18a))
* upgrade to Clerk v5 and use Clerk's Core 2 ([c1978f1](https://github.com/ixartz/Next-js-Boilerplate/commit/c1978f181a7c29e443fe407d91dfb9c2ae147f04))


### Reverts

* add back process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ([f8cb9f4](https://github.com/ixartz/Next-js-Boilerplate/commit/f8cb9f441e08ec4f0e4501e4b42b4923adbc01a1))
* downgrade React to 18.2 due to testing errors, error raised in Next.js issue [#65161](https://github.com/ixartz/Next-js-Boilerplate/issues/65161) ([1815eb3](https://github.com/ixartz/Next-js-Boilerplate/commit/1815eb3670f53b4d949a06505e8ef3afd4ab0ee5))

# [3.46.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.45.0...v3.46.0) (2024-04-13)


### Features

* new turso logo ([3e781fc](https://github.com/ixartz/Next-js-Boilerplate/commit/3e781fc75201a7271a3a640a0b665adb1560add6))
* use new Turso tagline ([601ba6b](https://github.com/ixartz/Next-js-Boilerplate/commit/601ba6b2a4beb1a0c6779964d2d654bd3553f044))

# [3.45.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.44.1...v3.45.0) (2024-04-04)


### Features

* remove next-sitemap and use the native Next.js sitemap/robots.txt ([135a435](https://github.com/ixartz/Next-js-Boilerplate/commit/135a4350bef905d2a38a8901d42e5fa304fb92bc))

## [3.44.1](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.44.0...v3.44.1) (2024-04-03)


### Bug Fixes

* add Twitter in the index page ([75dfb8b](https://github.com/ixartz/Next-js-Boilerplate/commit/75dfb8bc5ca40446005f8d405add52d09071f62a))
* use new VSCode Jest configuration ([e92e4e0](https://github.com/ixartz/Next-js-Boilerplate/commit/e92e4e09c636944d85cec38683738520224acebb))

# [3.44.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.43.0...v3.44.0) (2024-04-02)


### Features

* run migration only in development and eslint-disable need to be at the top ([db94f31](https://github.com/ixartz/Next-js-Boilerplate/commit/db94f31615cd5ffcc3739ab56572646f7ce1f177))

# [3.43.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.42.0...v3.43.0) (2024-03-07)


### Features

* use eslintrc.json and give release.yml permission in GitHub Actions ([a329518](https://github.com/ixartz/Next-js-Boilerplate/commit/a32951811e157696ab915eebd6b71b09f49ccb83))

# [3.42.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.41.0...v3.42.0) (2024-02-22)


### Features

* remove import React when it's not needed ([a7082d3](https://github.com/ixartz/Next-js-Boilerplate/commit/a7082d3492d9a426218829f86554b2aeda9da8fd))

# [3.41.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.40.0...v3.41.0) (2024-02-09)


### Features

* add target blank for links going outside ([37ba36e](https://github.com/ixartz/Next-js-Boilerplate/commit/37ba36e5e3815d87cf882dc9aaf8b69b5849b49e))
* make the index page of the boilerplate cleaner ([f3a3f9b](https://github.com/ixartz/Next-js-Boilerplate/commit/f3a3f9b306bfaed85058d59cd15e62db158468ca))

# [3.40.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.39.0...v3.40.0) (2024-02-07)


### Features

* add pino.js as Logger ([1d35f43](https://github.com/ixartz/Next-js-Boilerplate/commit/1d35f43efd5e250498d2d30654be672e4e2d91c9))

# [3.39.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.38.0...v3.39.0) (2024-02-07)


### Features

* add preferType on VSCode ([a55bc6a](https://github.com/ixartz/Next-js-Boilerplate/commit/a55bc6a4b543c47ec491c5a84806f62c93dc1aa4))

# [3.38.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.37.0...v3.38.0) (2024-01-19)


### Features

* update to Next.js 14.1 ([5dab52d](https://github.com/ixartz/Next-js-Boilerplate/commit/5dab52d58648a12b5779f04d642ad4b2010931b0))

# [3.37.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.36.0...v3.37.0) (2024-01-13)


### Features

* add environment variables for one click deploy Netlify ([5becdbf](https://github.com/ixartz/Next-js-Boilerplate/commit/5becdbf59f43fdfe893c5b7b62cac1246787a07e))

# [3.36.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.35.0...v3.36.0) (2024-01-10)


### Features

* prod environement use the same method to migrate ([f6cfe7f](https://github.com/ixartz/Next-js-Boilerplate/commit/f6cfe7fa7583621c9161aa478f1d958d5c93c083))


### Reverts

* add back process.env.NODE_ENV check in README file for migrate ([853f3dc](https://github.com/ixartz/Next-js-Boilerplate/commit/853f3dc4cbade618902b382023fe6a6a8e947082))
* only run migration in development, if it run in production, it also run during the build ([c94a600](https://github.com/ixartz/Next-js-Boilerplate/commit/c94a6007b20f71fe10b10c76a05659364ee920ff))

# [3.35.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.34.0...v3.35.0) (2024-01-07)


### Features

* automatically run migrate in DB instead of running in NPM scripts ([b202686](https://github.com/ixartz/Next-js-Boilerplate/commit/b202686687a41eb38cf92a0451f03b5f0a854a2d))
* e2e tests run against next start with production code ([a57f724](https://github.com/ixartz/Next-js-Boilerplate/commit/a57f72402c459b75aec65472db7030557974643b))
* jest fail on console error and warn ([2dd92f2](https://github.com/ixartz/Next-js-Boilerplate/commit/2dd92f2db19df25210f0aa6eb8b9c44136a16ab7))


### Reverts

* change related to running playwright with next start ([1a2d0b6](https://github.com/ixartz/Next-js-Boilerplate/commit/1a2d0b6473e6e7b4965c7df353d39645a8688273))
* change related to running playwright with next start ([e9e0c17](https://github.com/ixartz/Next-js-Boilerplate/commit/e9e0c1790a8e76b51ee8a0b1012cc3492349bd1b))

# [3.34.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.33.0...v3.34.0) (2024-01-06)


### Features

* add type definition in Postcss config ([07906ff](https://github.com/ixartz/Next-js-Boilerplate/commit/07906ff20a7c8d2b0c24cc1f33c93b0bc541b9c3))
* change commitlint config from JS to TS ([6509805](https://github.com/ixartz/Next-js-Boilerplate/commit/650980539eb16c4ef0f5d1ed3e833cdb08faaf86))
* change jest config extension from js to TypeScript ([1cdea44](https://github.com/ixartz/Next-js-Boilerplate/commit/1cdea44c2a193e9df792dc997f6aa5304e043ff6))
* change nodeResolution to the new bundler from TypeScript 5.0 ([59282a2](https://github.com/ixartz/Next-js-Boilerplate/commit/59282a2f028a10b841f4af42248e4ecd2c41c080))
* convert Tailwind config file from JS to TS ([aff3b27](https://github.com/ixartz/Next-js-Boilerplate/commit/aff3b276c6b857570c3ec0b68de3cd5efaaeebbd))

# [3.33.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.32.1...v3.33.0) (2024-01-03)


### Features

* enable SWC compiler in Storybook ([5b4c61e](https://github.com/ixartz/Next-js-Boilerplate/commit/5b4c61ea11164b6e5853cefe363d2d433cda374d))

## [3.32.1](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.32.0...v3.32.1) (2023-12-27)


### Bug Fixes

* typo in en.json file for Portfolio word ([4d42b3d](https://github.com/ixartz/Next-js-Boilerplate/commit/4d42b3d11feeb1134961c0c688a6659b5e88364e))

# [3.32.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.31.0...v3.32.0) (2023-12-22)


### Features

* add code coverage reporting with Codecov ([08abd23](https://github.com/ixartz/Next-js-Boilerplate/commit/08abd23acbb5fb770046900901a367d60f18695e))

# [3.31.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.30.1...v3.31.0) (2023-12-20)


### Features

* add FIXME tag for Sentry configuration ([2eceef1](https://github.com/ixartz/Next-js-Boilerplate/commit/2eceef14257232c89f625acfe475c1aa7f220e46))
* add Sentry and launch spotlight.js in dev mode ([a1326ae](https://github.com/ixartz/Next-js-Boilerplate/commit/a1326aebb4ade33dc8a4429e749fb482ed906754))
* add spotlight ([34086c1](https://github.com/ixartz/Next-js-Boilerplate/commit/34086c1b8636bdc391c31ceed062a1e858d81539))
* enable Sentry Spotlight only in development mode ([62cc01a](https://github.com/ixartz/Next-js-Boilerplate/commit/62cc01ab2e1ae5594a4b91f931f313a904ff4b7d))
* ignore technical exception throw by React RSC in Sentry ([4bf9503](https://github.com/ixartz/Next-js-Boilerplate/commit/4bf95038600a28ea3e98e84dabec4df5fd9af609))
* in global error get locale in params and set in html lang attribute ([c3b4d25](https://github.com/ixartz/Next-js-Boilerplate/commit/c3b4d25d3be6a5ceed48f2d365bd14e44ff9b114))

## [3.30.1](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.30.0...v3.30.1) (2023-12-17)


### Bug Fixes

* api routes not found after apply intl middleware ([4650a5e](https://github.com/ixartz/Next-js-Boilerplate/commit/4650a5e293716dee7704c6082839aaf94b63e7ad)), closes [#209](https://github.com/ixartz/Next-js-Boilerplate/issues/209)

# [3.30.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.29.0...v3.30.0) (2023-12-12)


### Features

* add GitHub Actions to sync with Crowdin ([ccc86e9](https://github.com/ixartz/Next-js-Boilerplate/commit/ccc86e9e4df89dadd3214ae167972038f44108a6))

# [3.29.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.28.0...v3.29.0) (2023-12-08)


### Features

* add i18n support for client component and typesafety for i18n keys ([2d86247](https://github.com/ixartz/Next-js-Boilerplate/commit/2d862478414c4e6cf06e287acbef50369ef9a119))
* add i18n support for Dashboard url used in Clerk ([12b89bc](https://github.com/ixartz/Next-js-Boilerplate/commit/12b89bcfa1cae76872fc1504960a5ee417ef5eea))
* add i18n with Clerk components and remove custom style in global.css file ([5e1af6c](https://github.com/ixartz/Next-js-Boilerplate/commit/5e1af6c9a83cc6988c68fd761bf4945a2e0cdb9c))
* add i18n with next-intl ([1f43eb2](https://github.com/ixartz/Next-js-Boilerplate/commit/1f43eb247ad8591fef3aa8a34d112dd804eec4c3))
* add locale switcher UI to change lang ([13b40e3](https://github.com/ixartz/Next-js-Boilerplate/commit/13b40e32d265d341da1cf723c1af36f3ea53e7e1))
* add metatags in App Router for page migrated from Pages Router ([ce8c277](https://github.com/ixartz/Next-js-Boilerplate/commit/ce8c2770c41abcc3c866d7320de6ef4d8a541715))
* add support i18n for authMiddleware ([8651d36](https://github.com/ixartz/Next-js-Boilerplate/commit/8651d36279512b0f5e008341916110a8ee6f167a))
* add tests for page in App Router ([6a722a1](https://github.com/ixartz/Next-js-Boilerplate/commit/6a722a1fec7a236973f794edc6583a245ebb4747))
* convert all hard coded text and translate in french ([0c3b1b2](https://github.com/ixartz/Next-js-Boilerplate/commit/0c3b1b2f9a8ae5c0d34cb6f3a227a907aca00342))
* i18n for page metatag ([5e7676d](https://github.com/ixartz/Next-js-Boilerplate/commit/5e7676de0d58238de1d46e662c3c8e6e00bd2c5b))
* link in BaseTemplate replaced margin with gap ([28b6ff2](https://github.com/ixartz/Next-js-Boilerplate/commit/28b6ff24577b5d4338a7da068e06070c7f50f195))
* migreate the index page from Page Rotuer to App Router ([fd3e82c](https://github.com/ixartz/Next-js-Boilerplate/commit/fd3e82c2ff837951277a8300fd95f15294b9290a))
* move messages folder to locales ([305e385](https://github.com/ixartz/Next-js-Boilerplate/commit/305e38504939008ecfbbd3bfb6deaf052e57eae7))
* remove Page router and migrate about page to App Router ([3965cbf](https://github.com/ixartz/Next-js-Boilerplate/commit/3965cbf89a67a64272b895809a31791ccf383b57))
* translate text in dashboard layout ([8119f1d](https://github.com/ixartz/Next-js-Boilerplate/commit/8119f1db63853f83710a6cc1f3135b45bc209809))


### Reverts

* add back NEXT_PUBLIC_CLERK_SIGN_IN_URL in the previous location ([16ae2ef](https://github.com/ixartz/Next-js-Boilerplate/commit/16ae2ef3a7b2800a3ac4d847bb7afa70743ee805))
* add back style for a tag link ([c12a7bd](https://github.com/ixartz/Next-js-Boilerplate/commit/c12a7bd400c875a115eefe2a9921db9e36bf644d))
* use percy/cli 1.27.4 instead of 1.27.5, impossible to upload snapshort with 1.27.5 ([73f8a0b](https://github.com/ixartz/Next-js-Boilerplate/commit/73f8a0b0e9c69f83e5c5a2b51f52159fcc43c654))

# [3.28.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.27.0...v3.28.0) (2023-11-22)


### Features

* rename custom SignOutButton to LogOutButton to avoid confusion with Clerk SignOutButton ([183301b](https://github.com/ixartz/Next-js-Boilerplate/commit/183301b5e87bfa4479727c295e83b45b923454a0))
* use custom SignOutButton to apply custom CSS styles, unified with other nav links ([35094bf](https://github.com/ixartz/Next-js-Boilerplate/commit/35094bf038f0eae6e7e2d77238840c97cc7adabe))

# [3.27.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.26.0...v3.27.0) (2023-11-20)


### Features

* add PRODUCTION_URL environment variable and throw error when targetURL doesn't exist ([8134dee](https://github.com/ixartz/Next-js-Boilerplate/commit/8134dee84205e297020851bad4c81cf3906e7dfe))
* unified e2e tests for Checkly and playwright ([afa53f5](https://github.com/ixartz/Next-js-Boilerplate/commit/afa53f56b51f9a537131ceb046f90ea59c17dd71))
* use target URl instead of baseURL for checkly ([4fd61ed](https://github.com/ixartz/Next-js-Boilerplate/commit/4fd61edc77e1ef0d457cb829a89545f7dab47210))

# [3.26.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.25.0...v3.26.0) (2023-11-15)


### Features

* add a new GitHub Actions file for Checkly ([2109b1c](https://github.com/ixartz/Next-js-Boilerplate/commit/2109b1c75359a9ce89c2c0773fd65e78e1439403))
* add aria-label to fix jsx-a11y/control-has-associated-label error ([47e4ff4](https://github.com/ixartz/Next-js-Boilerplate/commit/47e4ff4f811b4e2071b9ba31f5c0ad1367b0caba))
* add email alert channel for checkly ([d1a4380](https://github.com/ixartz/Next-js-Boilerplate/commit/d1a43801d64fa261bdb252cf83dc289742f37294))
* add email channel in Checkly configuration to send emails when failing ([2019591](https://github.com/ixartz/Next-js-Boilerplate/commit/20195919d8a07f4e3cc0b7884e7d972de2935a94))
* create checkly config with a random working test ([32255b0](https://github.com/ixartz/Next-js-Boilerplate/commit/32255b0770ec5be84e9fd3321154329c556aedee))
* remove eslint rule customization in VSCode and use min(1) instead of nonempty (deprecated) ([9982a2d](https://github.com/ixartz/Next-js-Boilerplate/commit/9982a2d94fe7854eefaa754e9f41cf4735a81c86))
* update package-lock.json to fix CI ([1fff7ef](https://github.com/ixartz/Next-js-Boilerplate/commit/1fff7efe7295a9ee750b9f05af1a670db7bda733))

# [3.25.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.24.0...v3.25.0) (2023-10-30)


### Features

* release a new version for Next.js 14 and update README file ([4be2485](https://github.com/ixartz/Next-js-Boilerplate/commit/4be24850b75b9ca896e9e5546b8357745b128398))

# [3.24.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.23.0...v3.24.0) (2023-10-24)


### Features

* make guestbook endpoint avaiable to signed out users ([10b4d81](https://github.com/ixartz/Next-js-Boilerplate/commit/10b4d814d477e3475569537b1ef01a86b68c9a43))

# [3.23.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.22.0...v3.23.0) (2023-10-12)


### Features

* add playwright extension in VSCode ([956d1a8](https://github.com/ixartz/Next-js-Boilerplate/commit/956d1a8ec70c6a1214c72a115f0378507aa1b436))
* add playwright plugin in ESLint ([b2486f1](https://github.com/ixartz/Next-js-Boilerplate/commit/b2486f1b1090c458115b873ddc5bffa8ecaf8412))
* add Playwright: config, first test and dependency ([f054ea2](https://github.com/ixartz/Next-js-Boilerplate/commit/f054ea264bab3376ab7f86b0a0fdc1b6a4e98350))
* remove all Cypress related files and configurations ([9fe8271](https://github.com/ixartz/Next-js-Boilerplate/commit/9fe8271e667b819910702803f5489e99766fe9ff))


### Reverts

* the failing test in Navigation spec ([28996f5](https://github.com/ixartz/Next-js-Boilerplate/commit/28996f59d2f02562761609348000d55776365f7e))

# [3.22.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.21.0...v3.22.0) (2023-10-02)


### Features

* remove basePath in Next.js configuration ([7f9a0e6](https://github.com/ixartz/Next-js-Boilerplate/commit/7f9a0e6ed42aec7d9ec500531b7f519dc11a5ec9))
* remove no-img-element and use Next.js built-in <Image component ([383e3a3](https://github.com/ixartz/Next-js-Boilerplate/commit/383e3a38b98d92d59184275864888e9693a1cff7))

# [3.21.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.20.0...v3.21.0) (2023-09-25)


### Features

* update next.js to version 13.5 ([aa43f14](https://github.com/ixartz/Next-js-Boilerplate/commit/aa43f14bea16fcb4fd786d9fe74ae37bf29b5b5f))
* update storybook to the latest version and install playwright ([2079a34](https://github.com/ixartz/Next-js-Boilerplate/commit/2079a347bbbd08d2ffbc4ea96995eaaf66602373))

# [3.20.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.19.0...v3.20.0) (2023-09-01)


### Features

* make updatedAt working when the user update a message and rename the attribute to updatedAt ([4032bc0](https://github.com/ixartz/Next-js-Boilerplate/commit/4032bc0123660c20a72aa52ed611ea1f150e54af))

# [3.19.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.18.0...v3.19.0) (2023-08-30)


### Features

* make it easier to try edge runtime in the app router ([3f5fd58](https://github.com/ixartz/Next-js-Boilerplate/commit/3f5fd58d0980fdd35860d31d29b8f18e9c93b53f))

# [3.18.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.17.0...v3.18.0) (2023-08-27)


### Features

* remove MIGRATE_DB which not needed anymore with process.env.NODE_ENV ([3fe81ae](https://github.com/ixartz/Next-js-Boilerplate/commit/3fe81ae98440b33ce18cee80265fdaa54e242184))

# [3.17.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.16.0...v3.17.0) (2023-08-27)


### Features

* add schema in drizzle instance and disable migrate in production ([5e26798](https://github.com/ixartz/Next-js-Boilerplate/commit/5e2679877a3da64a4cabfc22fdaacebd6abe6789))
* add script to migrate before building next.js ([220d05e](https://github.com/ixartz/Next-js-Boilerplate/commit/220d05e5d028852ccc533ca60b187bc3d47c5d73))
* do not run db migration when building on GitHub actions ([964cfa1](https://github.com/ixartz/Next-js-Boilerplate/commit/964cfa1a02fb41b387c851f0b2293c673859d60a))
* reload guestbook page when deployed on production ([c2e91b2](https://github.com/ixartz/Next-js-Boilerplate/commit/c2e91b2df944b0659d1768d2a7cc54a494d7d5c1))
* replace dotenv/config by dotenv-cli in db:studio NPM scripts ([f7f8743](https://github.com/ixartz/Next-js-Boilerplate/commit/f7f87435a984fa9d0407a7602d1ef38563c5e8d0))

# [3.16.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.15.0...v3.16.0) (2023-08-24)


### Bug Fixes

* build issues with prerendering ([ff117b9](https://github.com/ixartz/Next-js-Boilerplate/commit/ff117b9750e3609cebbf53a5dea01f0fbf94f865))


### Features

* add .env file for production ([58ed68c](https://github.com/ixartz/Next-js-Boilerplate/commit/58ed68cc2eefb1274e6e268c40a3ed8cd7d936be))
* add authToken support for production Turso ([26b8276](https://github.com/ixartz/Next-js-Boilerplate/commit/26b827618199f1dd73453c7ec021c13a4aaf5f7b))
* add await for migrate function ([96793f0](https://github.com/ixartz/Next-js-Boilerplate/commit/96793f0adedb10f802dfb46ff96b85f14c78ebf3))
* add database powered by Turso in guestbook page ([64073a5](https://github.com/ixartz/Next-js-Boilerplate/commit/64073a5babb38327a23fd3ae2b354152306e7977))
* add db file in gitignore ([cd45e09](https://github.com/ixartz/Next-js-Boilerplate/commit/cd45e0906cc79e87302ee6b88674089c5de059a3))
* add drizzle config and database schema ([df30388](https://github.com/ixartz/Next-js-Boilerplate/commit/df30388002ead9121ffb764e1bd11a71550cbe06))
* add style for guestbook ([339154c](https://github.com/ixartz/Next-js-Boilerplate/commit/339154ccfdaf7e53aeefd12fe0e347c645be5163))
* add typesafe environment variables ([5a2cd78](https://github.com/ixartz/Next-js-Boilerplate/commit/5a2cd78aca2fc60e6c0d4861ff656e7ba2ac86c4))
* create guestbook should not accept empty username and email ([37e4408](https://github.com/ixartz/Next-js-Boilerplate/commit/37e4408f968b36332a0a8ae9a90c687eee7fb4a0))
* implement AddGuestbookForm to create new guestbook message ([d7b37e6](https://github.com/ixartz/Next-js-Boilerplate/commit/d7b37e63f65d528e599b14d64cbf3ac5b2d3feba))
* implement delete guestbook entry ([b7f823a](https://github.com/ixartz/Next-js-Boilerplate/commit/b7f823a83435856ac32aea90da8317926e5b2b8b))
* improve UI for AddGuestbookForm ([153abfc](https://github.com/ixartz/Next-js-Boilerplate/commit/153abfc0e2f10a5aa59e24af8f0ef76667041578))
* insert in guestbook and retrieve all guestbooks ([23ee408](https://github.com/ixartz/Next-js-Boilerplate/commit/23ee4086a8c2166bdd6fe82b1cb50cc286793bb3))
* make guestbook editable ([8ec1406](https://github.com/ixartz/Next-js-Boilerplate/commit/8ec14066a966c76b02bf5552ec2f4f348048a45c))
* remove notnull in schema.ts ([10f4943](https://github.com/ixartz/Next-js-Boilerplate/commit/10f49434999ba0a884a72e640c67dc955bf7eedd))
* rename from email to username ([52ab0e4](https://github.com/ixartz/Next-js-Boilerplate/commit/52ab0e4f86b20ace52cbb6ce421f85357c0dfa6e))
* replace new-router page by guestbook ([efc84e6](https://github.com/ixartz/Next-js-Boilerplate/commit/efc84e607d23981dba07b931ff078776aa9693b5))
* replace with a working URL for the database to avoid timeout ([fecd8a5](https://github.com/ixartz/Next-js-Boilerplate/commit/fecd8a5d66934af774fde12759f8079cabfb382b))
* update dotenv path to .env, the file was renamed ([bd9b2c9](https://github.com/ixartz/Next-js-Boilerplate/commit/bd9b2c9efd12a0b54125ac352c43aab9d31c7c99))
* use local SQLite file ([fe52801](https://github.com/ixartz/Next-js-Boilerplate/commit/fe528010cf2d867fcbbc53156ae7fa6c862a88f4))
* validate t3 env on build ([6d448ed](https://github.com/ixartz/Next-js-Boilerplate/commit/6d448ed0fdea51952c8bfeaf4ce948cf9365675c))

# [3.15.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.14.1...v3.15.0) (2023-08-10)


### Features

* add next.js middleware with Clerk ([2f4a1d3](https://github.com/ixartz/Next-js-Boilerplate/commit/2f4a1d3e394eb835b011a13289f156a91993d782))
* add sign in and sign up link in index page ([4489085](https://github.com/ixartz/Next-js-Boilerplate/commit/4489085e8deb0ae1836a3741657f8331af6294ca))
* add sign in and sign up page ([f021f71](https://github.com/ixartz/Next-js-Boilerplate/commit/f021f71f755e3af3cb789d0330ad2a0237ec600d))
* add sign out button in dashboard ([c663d1c](https://github.com/ixartz/Next-js-Boilerplate/commit/c663d1c4799869faf2a2c549669521409f192830))
* add user profile to manage account ([470731b](https://github.com/ixartz/Next-js-Boilerplate/commit/470731ba960dfdd0aa57f66affde28b0226d5d42))
* add user profile to manage account ([581efbe](https://github.com/ixartz/Next-js-Boilerplate/commit/581efbef51cf700f9bbe94f268ff99639f5e49da))
* implement hello component by display user email address ([7047985](https://github.com/ixartz/Next-js-Boilerplate/commit/7047985ffbce9a986e7308040928783395cf7b68))
* implement sign out button ([8588834](https://github.com/ixartz/Next-js-Boilerplate/commit/8588834b5f1a53c51835d7aba5a4c9f1230c1bf7))
* implement sign out button and redirect to sign in page when logging out ([45ed137](https://github.com/ixartz/Next-js-Boilerplate/commit/45ed137d5c4e292ac8329f0661cb38fc29812927))
* redirect to dashboard when the user is signed in for sign up and sign in page ([629a033](https://github.com/ixartz/Next-js-Boilerplate/commit/629a03363af310e5411fea4cb554b53e72701e7d))

## [3.14.1](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.14.0...v3.14.1) (2023-08-07)


### Bug Fixes

* resolve sourcemap error with Cypress and TypeScript 5 ([54a5100](https://github.com/ixartz/Next-js-Boilerplate/commit/54a51004d6e22860eb1c6aad4ff689fac46bd0b4))

# [3.14.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.13.0...v3.14.0) (2023-08-03)


### Features

* use Next.js custom TypeScript plugin ([915e193](https://github.com/ixartz/Next-js-Boilerplate/commit/915e193f8037d36e9779fe7464a4d6c1685b3a94))

# [3.13.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.12.0...v3.13.0) (2023-08-02)


### Features

* add app routed pages ([9cc79a0](https://github.com/ixartz/Next-js-Boilerplate/commit/9cc79a00647b0a4ce64f66da4a430ec2c4972367)), closes [#64](https://github.com/ixartz/Next-js-Boilerplate/issues/64)
* add sitemap support app router ([b82e566](https://github.com/ixartz/Next-js-Boilerplate/commit/b82e566fb43d63329ef4507870494e554dea0e6a))
* app router doesn't support next export, use output: export ([76aa9cd](https://github.com/ixartz/Next-js-Boilerplate/commit/76aa9cd0597ad06fd0f0160ad6119a25b87d3336))
* generate statically portfolio pages ([1f1bf31](https://github.com/ixartz/Next-js-Boilerplate/commit/1f1bf3143215ab19d19cd4f13e4048b0ee84073c))
* update test for new router page ([b695666](https://github.com/ixartz/Next-js-Boilerplate/commit/b695666fd41c9ddf1886e9b5e3c7cc43b616820c))

# [3.12.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.11.0...v3.12.0) (2023-07-13)


### Features

* format code to respect prettier ([48b6a49](https://github.com/ixartz/Next-js-Boilerplate/commit/48b6a49fd204083deb94b01aab70b52a42b9593f))
* resolve conflict between airbnb-hook and next/core-web-vitals about react hooks ([5e0be4f](https://github.com/ixartz/Next-js-Boilerplate/commit/5e0be4fd8c2f9acd895f0b9ce373af7d782d44df))
* update to the latest dependencies version ([d93fd83](https://github.com/ixartz/Next-js-Boilerplate/commit/d93fd83b6ab93360ddd8489afc8cfb05603e504c))


### Reverts

* use older TypeScript to avoid e2e compilation with sourcemap ([6377d2f](https://github.com/ixartz/Next-js-Boilerplate/commit/6377d2f2efc71384fba236427086b4e75f189328))

# [3.11.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.10.1...v3.11.0) (2023-06-07)


### Features

* update dependencies to the latest version ([b7609de](https://github.com/ixartz/Next-js-Boilerplate/commit/b7609dea1c8bd49f6ac05439740ea78894cd4a79))

## [3.10.1](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.10.0...v3.10.1) (2023-05-29)


### Bug Fixes

* added types ([b35ddc9](https://github.com/ixartz/Next-js-Boilerplate/commit/b35ddc91ecad81986432dce1ba84c302e6394a5b))

# [3.10.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.9.0...v3.10.0) (2023-04-26)


### Features

* add vscode yoavbls.pretty-ts-errors extension ([3588ce1](https://github.com/ixartz/Next-js-Boilerplate/commit/3588ce1dd366ebaa69f97551be58528d1ae38457))
* remove stories in the coverage from Jest ([d502869](https://github.com/ixartz/Next-js-Boilerplate/commit/d502869a08a0b1d9025a4ce582651c5353f29d59))
* use default airbnb instead of the base version ([5c05116](https://github.com/ixartz/Next-js-Boilerplate/commit/5c05116fb777aee09c1af7df6694e54403eaaccb))

# [3.9.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.8.2...v3.9.0) (2023-04-05)


### Features

* add storybook into project ([51f3748](https://github.com/ixartz/Next-js-Boilerplate/commit/51f3748c0cb6d9cd04cdb0d3b9d95a0f60851866))
* add tailwind css support in Storybook ([5e0d287](https://github.com/ixartz/Next-js-Boilerplate/commit/5e0d287cef8a898df8f1a98632a8703657282100))
* remove warning for no extreneous deps in stories ([b243d44](https://github.com/ixartz/Next-js-Boilerplate/commit/b243d441e4b75566e16f5fa64d26900267eb89f5))


### Reverts

* remove storybook addon-styling which is not needed ([e863fed](https://github.com/ixartz/Next-js-Boilerplate/commit/e863fedcbc5a1aaf808c295d80f8de95b6abd1f7))

## [3.8.2](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.8.1...v3.8.2) (2023-03-28)


### Bug Fixes

* error generated by eslint-plugin-cypress ([7562c6b](https://github.com/ixartz/Next-js-Boilerplate/commit/7562c6bddb31e6941aee7e4e2bbcdabf5be3bddf))

## [3.8.1](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.8.0...v3.8.1) (2023-03-16)


### Bug Fixes

* typo in Readme ([8f7c1b7](https://github.com/ixartz/Next-js-Boilerplate/commit/8f7c1b79a46406b04b90ed8a5fe5029b3c24ff8c))

# [3.8.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.7.0...v3.8.0) (2023-03-02)


### Features

* fix heading levels increase by one ([e712e60](https://github.com/ixartz/Next-js-Boilerplate/commit/e712e60402f04033673d93e464d7b3c46fff7dbe))

# [3.7.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.6.0...v3.7.0) (2023-02-05)


### Features

* improve accessibility ([aa0f0b1](https://github.com/ixartz/Next-js-Boilerplate/commit/aa0f0b12085e31f13574fc9f4349157102d4467b))


### Reverts

* add support for all Node.js 14+, too restrictive with only Node.js 18+ ([4e27540](https://github.com/ixartz/Next-js-Boilerplate/commit/4e27540f638d4767fb60b612519669ad6bf69367))
* downgrade semantic-release version to 19 ([26d5a6e](https://github.com/ixartz/Next-js-Boilerplate/commit/26d5a6ebe2fc4fe59fef40779e132ccf1f31c09f))

# [3.6.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.5.4...v3.6.0) (2022-12-03)


### Bug Fixes

* add npx before percy command line ([4824e98](https://github.com/ixartz/Next-js-Boilerplate/commit/4824e98a4d621684494fe2c7e8c3351551e52845))
* retrive PERCY_TOKEN and set token for percy cli ([afe00f2](https://github.com/ixartz/Next-js-Boilerplate/commit/afe00f2e47b5dbc5fb701dd2e46756f4b7e498fd))
* wait until the link rendered instead a wrong heading tag ([e38655b](https://github.com/ixartz/Next-js-Boilerplate/commit/e38655b853b39fdcb9bccd3a84e99dd5caa1681d))


### Features

* add visual testing with Percy ([b0a39f5](https://github.com/ixartz/Next-js-Boilerplate/commit/b0a39f58e1bd0934158b0bab8ab7e4c9215e88f0))

## [3.5.4](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.5.3...v3.5.4) (2022-12-03)


### Bug Fixes

* change matching regex for Cypress files ([861d545](https://github.com/ixartz/Next-js-Boilerplate/commit/861d54596b61b7706cfbb681df334d73b34a378e))

## [3.5.3](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.5.2...v3.5.3) (2022-12-02)


### Bug Fixes

* resolve merge conflict ([276f57a](https://github.com/ixartz/Next-js-Boilerplate/commit/276f57aeb0d4a346f8e19ad81ce4703458d9f41c))

## [3.5.2](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.5.1...v3.5.2) (2022-12-02)


### Bug Fixes

* use npx npm-check-updates ([e530193](https://github.com/ixartz/Next-js-Boilerplate/commit/e5301939a5ff98c598899ff49bee1ad351759292))

## [3.5.1](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.5.0...v3.5.1) (2022-12-02)


### Bug Fixes

* add steps in update-deps.yml file, syntax error ([b5de445](https://github.com/ixartz/Next-js-Boilerplate/commit/b5de445f1f927a5a7c2b0c85746b8fd07629cb55))

# [3.5.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.4.0...v3.5.0) (2022-12-02)


### Features

* add auto-update GitHub Actions ([364168f](https://github.com/ixartz/Next-js-Boilerplate/commit/364168f3407c7cdd21da7cd1de6d9d930f89d99a))

# [3.4.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.3.0...v3.4.0) (2022-12-02)


### Features

* automatically format the whole codebase with npm run format ([9299209](https://github.com/ixartz/Next-js-Boilerplate/commit/92992096ede4d2b3e77c3e0c96b75e5e6b84067d))
* update footer message and comment ([4f74176](https://github.com/ixartz/Next-js-Boilerplate/commit/4f74176b05528666fd8b92a8becdc7e3c2f0db4a))

# [3.3.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.2.4...v3.3.0) (2022-11-22)


### Features

* change 'powered by' text to 'built' with ([fe0a29f](https://github.com/ixartz/Next-js-Boilerplate/commit/fe0a29f8fbab14c7e8c8e98a75ce488ac157e509))

## [3.2.4](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.2.3...v3.2.4) (2022-11-20)


### Bug Fixes

* update README file for next-sitemap ([9496217](https://github.com/ixartz/Next-js-Boilerplate/commit/94962171a35a07e84319374500f28a76f264a266))

## [3.2.3](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.2.2...v3.2.3) (2022-11-20)


### Bug Fixes

* add sitemap file in gitignore, it shouldn't commit to git ([344b731](https://github.com/ixartz/Next-js-Boilerplate/commit/344b7312df2f7e12e642a6346ef05ad9a7ca766c))

## [3.2.2](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.2.1...v3.2.2) (2022-11-20)


### Bug Fixes

* rename from mjs to js next-sitemap file ([7d450ff](https://github.com/ixartz/Next-js-Boilerplate/commit/7d450ffce77f0be4c533cb1aab757f7fb1f13596))

## [3.2.1](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.2.0...v3.2.1) (2022-11-20)


### Bug Fixes

* code styling in blog component pages ([f4a55c4](https://github.com/ixartz/Next-js-Boilerplate/commit/f4a55c4234fc03ed719859c12f13bffabd120c6d))
* move getStaticPaths at the top of blog page ([83892ea](https://github.com/ixartz/Next-js-Boilerplate/commit/83892ea865459f59da824c9358fbf4ccea6475e6))
* remove generated files by next-sitemap ([c5d93bf](https://github.com/ixartz/Next-js-Boilerplate/commit/c5d93bf9fe67a6737b536edf4d50d56cd4c8af2c))

# [3.2.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.1.0...v3.2.0) (2022-11-19)


### Features

* run github release only on completed CI workflow ([dd4de76](https://github.com/ixartz/Next-js-Boilerplate/commit/dd4de76b6ea013190a6ea18d69eb3764e1b915f9))

# [3.1.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v3.0.0...v3.1.0) (2022-11-19)


### Bug Fixes

* just rebuild sitemap ([831bae9](https://github.com/ixartz/Next-js-Boilerplate/commit/831bae93831eb5c4f259c4a0fa9ec3012ede8927))


### Features

* add blog page ([89c4ec7](https://github.com/ixartz/Next-js-Boilerplate/commit/89c4ec79db48f4ae09af3e8ddb3ce5a980ed8ee6))
* add sitemap.xml and robots.txt from build ([545d133](https://github.com/ixartz/Next-js-Boilerplate/commit/545d133decee4f7d42c228049ef3bde2b9a94b0a))
* disable Husky for release ([f20c595](https://github.com/ixartz/Next-js-Boilerplate/commit/f20c5951e018c99421e833eef6ce14bd9632838f))
* rename from master to main ([10920ec](https://github.com/ixartz/Next-js-Boilerplate/commit/10920ece4892ca73639388116af59fdd3e077d5f))
* update TypeScript to 4.9.x ([471dc70](https://github.com/ixartz/Next-js-Boilerplate/commit/471dc70306c69ecb524af40aa76403daa83597e2))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.0.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v2.1.1...v3.0.0) (2022-10-26)


### ⚠ BREAKING CHANGES

* update to Next.js 13 and Tailwind CSS 3.2

### Features

* add commit script in package.json ([8f4719e](https://github.com/ixartz/Next-js-Boilerplate/commit/8f4719ec550ab0dbffa93ca1d278aa9e370a773a))


### Bug Fixes

* Eslint comment update ([8baa5d1](https://github.com/ixartz/Next-js-Boilerplate/commit/8baa5d160734a3cadb419534509cc6edaac57456))


* update to Next.js 13 and Tailwind CSS 3.2 ([fc9f2c1](https://github.com/ixartz/Next-js-Boilerplate/commit/fc9f2c1cf914c15b36cdf881306d20b405a259e8))

### [2.1.1](https://github.com/ixartz/Next-js-Boilerplate/compare/v2.1.0...v2.1.1) (2022-09-08)

## [2.1.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v2.0.0...v2.1.0) (2022-07-08)


### Features

* add cypress and cypress eslint plugin ([5657ee6](https://github.com/ixartz/Next-js-Boilerplate/commit/5657ee6dab03b11020bb2ce80083669785edd6ce))

## [2.0.0](https://github.com/ixartz/Next-js-Boilerplate/compare/v1.1.0...v2.0.0) (2022-07-03)


### ⚠ BREAKING CHANGES

* add Jest and React testing library
* to React 18

### Features

* add coverage for vscode-jest and configure jest autoRun ([ad8a030](https://github.com/ixartz/Next-js-Boilerplate/commit/ad8a03019010577bfb8e8ed850e8d45ca274dbe9))
* add Jest and React testing library ([e182b87](https://github.com/ixartz/Next-js-Boilerplate/commit/e182b87db5943abbe706568e77285e1eb6bddf5e))
* add TypeScript support for Tailwind CSS configuration ([41f1918](https://github.com/ixartz/Next-js-Boilerplate/commit/41f19189655abe3941485363e057812a5fcd6c02))
* add vscode jest extension ([49ab935](https://github.com/ixartz/Next-js-Boilerplate/commit/49ab935a03f5a9d1074a155331107737fd7dad13))


* to React 18 ([c78f215](https://github.com/ixartz/Next-js-Boilerplate/commit/c78f2152a978a39b2c6d381427df8e8ad2a30099))

## 1.1.0 (2022-04-25)


### Features

* add commitlint with config-conventional ([97a9ac7](https://github.com/ixartz/Next-js-Boilerplate/commit/97a9ac7dbbca3f8d4fad22a9e4a481c029cd2cb5))


### Bug Fixes

* add missing files for commitzen ([018ba8b](https://github.com/ixartz/Next-js-Boilerplate/commit/018ba8bde81b0f6cc60230fe4668b149ac3b2e6a))
* update package-lock.json ([fba016d](https://github.com/ixartz/Next-js-Boilerplate/commit/fba016dec202d5748e30804b1bf50e30c00ef120))
