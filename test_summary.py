import json
import collections

try:
    with open('all-test-results.json') as f:
        data = json.load(f)
    
    failures = collections.defaultdict(list)
    for res in data['testResults']:
        file_name = res['name'].split('/')[-1]
        if 'assertionResults' in res:
            for assertResult in res['assertionResults']:
                if assertResult['status'] == 'failed':
                    msg = assertResult['failureMessages'][0].split('\n')[0] if assertResult.get('failureMessages') else 'Unknown Error'
                    failures[msg].append(file_name)
    
    print('Top Failures:')
    sorted_failures = sorted(failures.items(), key=lambda x: len(x[1]), reverse=True)
    for err, files in sorted_failures[:20]:
        print(f'{len(files)}x: {err}\n  Files: {set(files)}')
except Exception as e:
    print(f"Error: {e}")
