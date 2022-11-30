import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KoboToolbox2Api implements ICredentialType {
	name = 'koboToolbox2Api';
	displayName = 'KoboToolbox 2 API';
	// See https://support.kobotoolbox.org/api.html
	documentationUrl = 'https://github.com/Yann-J/n8n-nodes-kobotoolbox2';
	properties: INodeProperties[] = [
		{
			displayName: 'API Root URL',
			name: 'URL',
			type: 'string',
			default: 'https://kf.kobotoolbox.org/',
		},
		{
			displayName: 'API Token',
			name: 'token',
			type: 'string',
			default: '',
			hint: 'You can get your API token at https://[api-root]/token/?format=json (for a logged in user)',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Token {{$credentials.token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.URL}}',
			url: '/api/v2/assets/',
			method: 'GET',
		},
	};
}
