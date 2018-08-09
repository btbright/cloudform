## cloudform

# NOTE - I spoke with some AWS devs and they hinted that they are releasing a tool soon that will make this redundant. No longer under active development

# goals
- validate cloudformation templates and output all errors
- suggest edits to resolve errors when possible
- suggest automatic refactor edits when possible to make templates portable
- generate templates from live systems

# inspiration
- I've found that working with cloudformation templates is necessarily unweildy and would benefit from further automization
- I wrote this about my experiences: https://medium.com/@btbright/how-to-even-get-started-with-cloudformation-templates-b9a2c9d0623a

# todo

- implement issue resolvers for validations:
-- finish intrinsics - type check parameters refs
-- conditional intrinsics check
-- depends on

- implement validations:
-- resource limits
-- conditional required properties
