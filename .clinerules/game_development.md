The PROJECT_BRIEF.md file contains a Project Brief, defining the principles to be abided to (data driven, declarative, external logic in companion content files) and a Checklist that serves as a roadmap that we will update as we finish each task, as well as online resources that can be used as references for rules, implementation examples, and inspiration.

After every task, update the Checklist, adding the task to the Checklist if necessary, and match the existing code against the Checklist, looking for TODOs that might not already be on the Checklist, and determining if any of the tasks marked as completed in the Checklist are not currently implemented in the code.

Imports of .mjs files inside .mts files refer to another .mts file.
So if file1.mts imports file2.mjs, you'll search for file2.mts instead.