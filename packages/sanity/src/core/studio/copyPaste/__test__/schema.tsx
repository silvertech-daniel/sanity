import {defineType, type Schema} from '@sanity/types'

import {createSchema} from '../../../schema'

const linkType = defineType({
  type: 'object',
  name: 'link',
  fields: [
    {
      type: 'string',
      name: 'href',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    },
  ],
  validation: (Rule) => Rule.required(),
})

const myStringObjectType = defineType({
  type: 'object',
  name: 'myStringObject',
  fields: [{type: 'string', name: 'myString', validation: (Rule) => Rule.required()}],
})

const nestedObjectType = defineType({
  type: 'object',
  name: 'nestedObject',
  fields: [
    {
      name: 'title',
      type: 'string',
    },
    {
      type: 'array',
      name: 'objectList',
      of: [{type: 'nestedObject'}],
    },
    {
      type: 'object',
      name: 'recursiveTest',
      fields: [
        {
          name: 'recursive',
          type: 'nestedObject',
        },
      ],
    },
  ],
})

export const schema = createSchema({
  name: 'default',
  types: [
    linkType,
    myStringObjectType,
    nestedObjectType,
    {
      name: 'customNamedBlock',
      type: 'block',
      title: 'A named custom block',
      marks: {
        annotations: [linkType, myStringObjectType],
      },
      of: [
        {
          type: 'object',
          name: 'test',
          fields: [myStringObjectType],
        },
        {
          type: 'reference',
          name: 'strongAuthorRef',
          title: 'A strong author ref',
          to: {type: 'author'},
        },
      ],
    },
    {
      name: 'author',
      title: 'Author',
      type: 'document',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'born',
          type: 'number',
        },
        {
          name: 'favoriteNumbers',
          type: 'array',
          of: [{type: 'number'}],
        },
        {type: 'image', name: 'profileImage'},
        {
          type: 'object',
          name: 'socialLinks',
          fields: [
            {type: 'string', name: 'twitter'},
            {type: 'string', name: 'linkedin'},
          ],
        },
        {
          name: 'nestedTest',
          type: 'nestedObject',
        },
        {
          name: 'bio',
          type: 'array',
          of: [{type: 'customNamedBlock'}, {type: 'myStringObject'}],
        },
        {
          name: 'friends',
          type: 'array',
          of: [{type: 'reference', to: [{type: 'author'}]}],
        },
        {
          name: 'bestFriend',
          type: 'reference',
          to: [{type: 'author'}],
        },
      ],
    },
    {
      name: 'editor',
      title: 'Editor',
      type: 'document',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'born',
          type: 'number',
        },
        {type: 'image', name: 'profileImage'},
        {
          name: 'bio',
          type: 'array',
          of: [{type: 'customNamedBlock'}],
        },
        {
          name: 'favoriteNumbers',
          type: 'array',
          of: [{type: 'number'}],
        },
        {
          name: 'nestedTest',
          type: 'nestedObject',
        },
        {
          name: 'profile',
          type: 'object',
          fields: [
            {type: 'string', name: 'email'},
            {type: 'image', name: 'avatar'},
            {
              type: 'object',
              name: 'social',
              fields: [
                {type: 'string', name: 'twitter'},
                {type: 'string', name: 'linkedin'},
              ],
            },
          ],
        },
        {
          name: 'friends',
          type: 'array',
          of: [{type: 'reference', to: [{type: 'editor'}, {type: 'author'}]}],
        },
      ],
    },
    {
      name: 'post',
      title: 'Post',
      type: 'document',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        {
          name: 'body',
          type: 'array',
          of: [{type: 'customNamedBlock'}],
        },
        {
          name: 'author',
          type: 'reference',
          to: [{type: 'author'}],
        },
      ],
    },
  ],
}) as Schema
