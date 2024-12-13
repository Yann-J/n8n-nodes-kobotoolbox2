import { INodeProperties } from 'n8n-workflow';

export const fileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['file'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a file',
				action: 'Create a file',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete file',
				action: 'Delete a file',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a file content',
				action: 'Get a file content',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many files',
				action: 'Get many files',
			},
		],
		default: 'get',
	},
];

export const fileFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                file:*                                    */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Form Name or ID',
		name: 'formId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'loadForms',
		},
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['file'],
			},
		},
		description:
			'Form ID (e.g. aSAvYreNzVEkrWg5Gdcvg). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
	},
	/* -------------------------------------------------------------------------- */
	/*                                file:delete                                 */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Select File By',
		name: 'fileSelector',
		type: 'options',
		required: true,
		default: 'fileId',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['delete', 'get'],
			},
		},
		options: [
			{
				name: 'ID',
				value: 'fileId',
			},
			{
				name: 'File Name',
				value: 'fileName',
			},
		],
		description: 'Select the file by ID or name',
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['delete', 'get'],
				fileSelector: ['fileName'],
			},
		},
		description: 'File Name (e.g. "myFile.jpg")',
	},
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['delete', 'get'],
				fileSelector: ['fileId'],
			},
		},
		description: 'Uid of the file (should start with "af" e.g. "afQoJxA4kmKEXVpkH6SYbhb"',
	},
	{
		displayName: 'Download File Content',
		name: 'download',
		type: 'boolean',
		required: true,
		default: false,
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['get', 'getAll'],
			},
		},
		description: 'Whether to download the file content into a binary property',
	},
	{
		displayName: 'Property Name',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['get', 'getAll'],
				download: [true],
			},
		},
		description: 'Name of the binary property to write the file into',
	},
	{
		displayName: 'File Upload Mode',
		name: 'fileMode',
		type: 'options',
		required: true,
		default: 'binary',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'Binary Data',
				value: 'binary',
			},
			{
				name: 'Plain Text',
				value: 'text',
			},
			{
				name: 'URL',
				value: 'url',
			},
		],
	},
	{
		displayName: 'Property Name',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['create'],
				fileMode: ['binary'],
			},
		},
		description:
			'Name of the property (binary or JSON) containing the file to upload. Supported types: image, audio, video, csv, xml, zip.',
	},
	{
		displayName: 'File Content',
		name: 'fileContent',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['create'],
				fileMode: ['text'],
			},
		},
		description: 'File content to upload, in plain text',
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['create'],
				fileMode: ['text'],
			},
		},
		description: 'File Name (e.g. "myFile.jpg")',
	},
	{
		displayName: 'Mime Type',
		name: 'mimeType',
		type: 'string',
		default: 'text/plain',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['create'],
				fileMode: ['text'],
			},
		},
		description: 'Mime Type to set for the file',
	},
	{
		displayName: 'File URL',
		name: 'fileUrl',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['create'],
				fileMode: ['url'],
			},
		},
		description: 'HTTP(s) link to the file to upload',
	},
	{
		displayName: 'Overwrite Existing File with Same Name?',
		name: 'overwrite',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['create'],
			},
		},
		description: 'Whether any pre-existing file with the same name will be deleted before upload',
	},
];
