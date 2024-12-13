import { IExecuteFunctions } from 'n8n-core';

import {
	IBinaryData,
	IBinaryKeyData,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import {
	downloadAttachments,
	formatSubmission,
	getFormFileByName,
	koboToolboxApiRequest,
	koboToolboxRawRequest,
	loadForms,
	parseStringList,
} from './GenericFunctions';

import { formFields, formOperations } from './FormDescription';

import { submissionFields, submissionOperations } from './SubmissionDescription';

import { hookFields, hookOperations } from './HookDescription';

import { fileFields, fileOperations } from './FileDescription';

export class KoboToolbox2 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KoboToolbox 2',
		name: 'koboToolbox2',
		icon: 'file:koboToolbox.svg',
		group: ['transform'],
		version: 1,
		description: 'Work with KoboToolbox forms and submissions',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		defaults: {
			name: 'KoboToolbox',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'koboToolbox2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'File',
						value: 'file',
					},
					{
						name: 'Form',
						value: 'form',
					},
					{
						name: 'Hook',
						value: 'hook',
					},
					{
						name: 'Submission',
						value: 'submission',
					},
				],
				default: 'submission',
				required: true,
			},
			...formOperations,
			...formFields,
			...hookOperations,
			...hookFields,
			...submissionOperations,
			...submissionFields,
			...fileOperations,
			...fileFields,
		],
	};

	methods = {
		loadOptions: {
			loadForms,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// tslint:disable-next-line:no-any
		let responseData: any;
		// tslint:disable-next-line:no-any
		let returnData: any[] = [];
		const binaryItems: INodeExecutionData[] = [];
		const items = this.getInputData();
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			if (resource === 'form') {
				// *********************************************************************
				//                             Form
				// *********************************************************************

				if (operation === 'get') {
					// ----------------------------------
					//          Form: get
					// ----------------------------------
					const formId = this.getNodeParameter('formId', i) as string;
					responseData = [
						await koboToolboxApiRequest.call(this, {
							url: `/api/v2/assets/${formId}`,
						}),
					];
				}

				if (operation === 'getAll') {
					// ----------------------------------
					//          Form: getAll
					// ----------------------------------
					const formQueryOptions = this.getNodeParameter('options', i) as {
						sort: {
							value: {
								descending: boolean;
								ordering: string;
							};
						};
					};
					const formFilterOptions = this.getNodeParameter('filters', i) as IDataObject;

					responseData = await koboToolboxApiRequest.call(this, {
						url: '/api/v2/assets/',
						qs: {
							limit: this.getNodeParameter('limit', i, 1000) as number,
							...(formFilterOptions.filter && { q: formFilterOptions.filter }),
							...(formQueryOptions?.sort?.value?.ordering && {
								ordering:
									(formQueryOptions?.sort?.value?.descending ? '-' : '') +
									formQueryOptions?.sort?.value?.ordering,
							}),
						},
						scroll: this.getNodeParameter('returnAll', i) as boolean,
					});
				}

				if (operation === 'redeploy') {
					// ----------------------------------
					//          Form: redeploy
					// ----------------------------------
					const formId = this.getNodeParameter('formId', i) as string;
					responseData = [
						await koboToolboxApiRequest.call(this, {
							method: 'PATCH',
							url: `/api/v2/assets/${formId}/deployment/`,
						}),
					];
				}
			}

			if (resource === 'submission') {
				// *********************************************************************
				//                             Submissions
				// *********************************************************************
				const formId = this.getNodeParameter('formId', i) as string;

				if (operation === 'getAll') {
					// ----------------------------------
					//          Submissions: getAll
					// ----------------------------------

					const submissionQueryOptions = this.getNodeParameter('options', i) as IDataObject;
					const filterJson = this.getNodeParameter('filterJson', i, null) as string;

					responseData = await koboToolboxApiRequest.call(this, {
						url: `/api/v2/assets/${formId}/data/`,
						qs: {
							limit: this.getNodeParameter('limit', i, 1000) as number,
							...(filterJson && { query: filterJson }),
							...(submissionQueryOptions.sort && { sort: submissionQueryOptions.sort }),
							...(submissionQueryOptions.fields && {
								fields: JSON.stringify(parseStringList(submissionQueryOptions.fields as string)),
							}),
						},
						scroll: this.getNodeParameter('returnAll', i) as boolean,
					});

					if (submissionQueryOptions.reformat) {
						responseData = responseData.map((submission: IDataObject) => {
							return formatSubmission(
								submission,
								parseStringList(submissionQueryOptions.selectMask as string),
								parseStringList(submissionQueryOptions.numberMask as string),
							);
						});
					}

					if (submissionQueryOptions.download) {
						// Download related attachments
						for (const submission of responseData) {
							binaryItems.push(
								await downloadAttachments.call(this, submission, submissionQueryOptions),
							);
						}
					}
				}

				if (operation === 'get') {
					// ----------------------------------
					//          Submissions: get
					// ----------------------------------
					const submissionId = this.getNodeParameter('submissionId', i) as string;
					const options = this.getNodeParameter('options', i) as IDataObject;

					responseData = [
						await koboToolboxApiRequest.call(this, {
							url: `/api/v2/assets/${formId}/data/${submissionId}`,
							qs: {
								...(options.fields && {
									fields: JSON.stringify(parseStringList(options.fields as string)),
								}),
							},
						}),
					];

					if (options.reformat) {
						responseData = responseData.map((submission: IDataObject) => {
							return formatSubmission(
								submission,
								parseStringList(options.selectMask as string),
								parseStringList(options.numberMask as string),
							);
						});
					}

					if (options.download) {
						// Download related attachments
						for (const submission of responseData) {
							binaryItems.push(await downloadAttachments.call(this, submission, options));
						}
					}
				}

				if (operation === 'delete') {
					// ----------------------------------
					//          Submissions: delete
					// ----------------------------------
					const id = this.getNodeParameter('submissionId', i) as string;

					await koboToolboxApiRequest.call(this, {
						method: 'DELETE',
						url: `/api/v2/assets/${formId}/data/${id}`,
					});

					responseData = [
						{
							success: true,
						},
					];
				}

				if (operation === 'getValidation') {
					// ----------------------------------
					//          Submissions: getValidation
					// ----------------------------------
					const submissionId = this.getNodeParameter('submissionId', i) as string;

					responseData = [
						await koboToolboxApiRequest.call(this, {
							url: `/api/v2/assets/${formId}/data/${submissionId}/validation_status/`,
						}),
					];
				}

				if (operation === 'setValidation') {
					// ----------------------------------
					//          Submissions: setValidation
					// ----------------------------------
					const submissionId = this.getNodeParameter('submissionId', i) as string;
					const status = this.getNodeParameter('validationStatus', i) as string;

					responseData = [
						await koboToolboxApiRequest.call(this, {
							method: 'PATCH',
							url: `/api/v2/assets/${formId}/data/${submissionId}/validation_status/`,
							body: {
								'validation_status.uid': status,
							},
						}),
					];
				}
			}

			if (resource === 'hook') {
				const formId = this.getNodeParameter('formId', i) as string;
				// *********************************************************************
				//                             Hook
				// *********************************************************************

				if (operation === 'getAll') {
					// ----------------------------------
					//          Hook: getAll
					// ----------------------------------
					responseData = await koboToolboxApiRequest.call(this, {
						url: `/api/v2/assets/${formId}/hooks/`,
						qs: {
							limit: this.getNodeParameter('limit', i, 1000) as number,
						},
						scroll: this.getNodeParameter('returnAll', i) as boolean,
					});
				}

				if (operation === 'get') {
					// ----------------------------------
					//          Hook: get
					// ----------------------------------
					const hookId = this.getNodeParameter('hookId', i) as string;
					responseData = [
						await koboToolboxApiRequest.call(this, {
							url: `/api/v2/assets/${formId}/hooks/${hookId}`,
						}),
					];
				}

				if (operation === 'retryAll') {
					// ----------------------------------
					//          Hook: retryAll
					// ----------------------------------
					const hookId = this.getNodeParameter('hookId', i) as string;
					responseData = [
						await koboToolboxApiRequest.call(this, {
							method: 'PATCH',
							url: `/api/v2/assets/${formId}/hooks/${hookId}/retry/`,
						}),
					];
				}

				if (operation === 'getLogs') {
					// ----------------------------------
					//          Hook: getLogs
					// ----------------------------------
					const hookId = this.getNodeParameter('hookId', i) as string;
					const startDate = this.getNodeParameter('startDate', i, null);
					const endDate = this.getNodeParameter('endDate', i, null);
					const status = this.getNodeParameter('status', i, null);

					responseData = await koboToolboxApiRequest.call(this, {
						url: `/api/v2/assets/${formId}/hooks/${hookId}/logs/`,
						qs: {
							...(startDate && { start: startDate }),
							...(endDate && { end: endDate }),
							...(status && { status }),
						},
					});
				}

				if (operation === 'retryOne') {
					// ----------------------------------
					//          Hook: retryOne
					// ----------------------------------
					const hookId = this.getNodeParameter('hookId', i) as string;
					const logId = this.getNodeParameter('logId', i) as string;

					responseData = [
						await koboToolboxApiRequest.call(this, {
							method: 'PATCH',
							url: `/api/v2/assets/${formId}/hooks/${hookId}/logs/${logId}/retry/`,
						}),
					];
				}
			}

			if (resource === 'file') {
				// *********************************************************************
				//                             File
				// *********************************************************************
				const formId = this.getNodeParameter('formId', i) as string;

				if (operation === 'getAll') {
					const download = this.getNodeParameter('download', i) as boolean;

					const files = await koboToolboxApiRequest.call(this, {
						url: `/api/v2/assets/${formId}/files`,
						qs: {
							file_type: 'form_media',
						},
						scroll: true,
					});

					if (download) {
						for (const file of files) {
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;

							const binaryItem: INodeExecutionData = {
								json: file,
								binary: {},
							};

							const response = await koboToolboxRawRequest.call(this, {
								url: `/api/v2/assets/${formId}/files/${file.uid}/content`,
								encoding: 'arraybuffer',
							});

							binaryItem.binary![binaryPropertyName] = await this.helpers.prepareBinaryData(
								response,
								file.metadata.filename,
							);

							binaryItems.push(binaryItem);
						}
					} else {
						responseData = files;
					}
				}

				if (operation === 'get') {
					const fileSelector = this.getNodeParameter('fileSelector', i) as string;
					const fileName = this.getNodeParameter('fileName', i, null) as string;
					let fileId = this.getNodeParameter('fileId', i, null) as string;
					const download = this.getNodeParameter('download', i) as boolean;

					if ('fileName' === fileSelector) {
						const file = await getFormFileByName.call(this, formId, fileName);
						fileId = file?.uid;
					}

					if (!fileId) {
						throw new NodeOperationError(
							this.getNode(),
							`No file found matching name "${fileName}"`,
						);
					}

					responseData = [
						await koboToolboxApiRequest.call(this, {
							url: `/api/v2/assets/${formId}/files/${fileId}`,
						}),
					];

					if (responseData && responseData[0] && download) {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;

						const binaryItem: INodeExecutionData = {
							json: responseData[0],
							binary: {},
						};

						const response = await koboToolboxRawRequest.call(this, {
							url: `/api/v2/assets/${formId}/files/${fileId}/content`,
							encoding: 'arraybuffer',
						});

						console.dir(response);

						binaryItem.binary![binaryPropertyName] = await this.helpers.prepareBinaryData(
							response,
							responseData[0].metadata.filename,
						);

						binaryItems.push(binaryItem);
					}
				}

				if (operation === 'delete') {
					const fileSelector = this.getNodeParameter('fileSelector', i) as string;
					const fileName = this.getNodeParameter('fileName', i, null) as string;
					let fileId = this.getNodeParameter('fileId', i, null) as string;

					if ('fileName' === fileSelector) {
						const file = await getFormFileByName.call(this, formId, fileName);
						fileId = file?.uid;
					}

					if (!fileId) {
						throw new NodeOperationError(
							this.getNode(),
							`No file found matching name "${fileName}"`,
						);
					}

					responseData = [
						await koboToolboxApiRequest.call(this, {
							method: 'DELETE',
							url: `/api/v2/assets/${formId}/files/${fileId}`,
						}),
					];
				}

				if (operation === 'create') {
					const fileMode = this.getNodeParameter('fileMode', i) as string;
					const overwrite = this.getNodeParameter('overwrite', i) as boolean;

					// tslint:disable-next-line:no-any
					const body: any = {
						description: 'Uploaded file',
						file_type: 'form_media',
					};

					if ('binary' === fileMode) {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						const item = items[i].binary as IBinaryKeyData;
						const binaryData = item[binaryPropertyName] as IBinaryData;

						body.base64Encoded = 'data:' + binaryData.mimeType + ';base64,' + binaryData.data;
						body.metadata = {
							filename: binaryData.fileName,
						};
					} else if ('text' === fileMode) {
						// Use base64 encoding to upload
						const fileName = this.getNodeParameter('fileName', i) as string;
						const mimeType = this.getNodeParameter('mimeType', i) as string;
						const fileContent = this.getNodeParameter('fileContent', i) as string;
						const base64Content = Buffer.from(fileContent).toString('base64');
						body.base64Encoded = 'data:' + mimeType + ';base64,' + base64Content;
						body.metadata = {
							filename: fileName,
						};
					} else {
						const fileUrl = this.getNodeParameter('fileUrl', i) as string;

						body.metadata = {
							redirect_url: fileUrl,
						};
					}

					if (overwrite && body.metadata?.filename) {
						const file = await getFormFileByName.call(this, formId, body.metadata.filename);
						if (file) {
							// File with same name already exists, delete it
							const resp = await koboToolboxApiRequest.call(this, {
								method: 'DELETE',
								url: `/api/v2/assets/${formId}/files/${file.uid}`,
							});
						}
					}

					responseData = [
						await koboToolboxApiRequest.call(this, {
							method: 'POST',
							url: `/api/v2/assets/${formId}/files/`,
							body,
						}),
					];
				}
			}

			returnData = returnData.concat(responseData);
		}

		// Map data to n8n data
		return binaryItems.length > 0 ? [binaryItems] : [this.helpers.returnJsonArray(returnData)];
	}
}
