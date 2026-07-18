import re
import sys

def main():
    filepath = 'setup.sql'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove events table block
    content = re.sub(r'create table events \(.*?create table event_attendance', 'create table event_attendance', content, flags=re.DOTALL)
    
    # 2. Remove event_attendance table block
    content = re.sub(r'create table event_attendance \(.*?\);\n', '', content, flags=re.DOTALL)
    
    # 3. Remove create index on events
    content = re.sub(r'create index on events\(.*?\);\n', '', content)
    
    # 4. Remove enable row level security on events
    content = re.sub(r'alter table events enable row level security;\n', '', content)
    content = re.sub(r'alter table event_attendance enable row level security;\n', '', content)
    
    # 5. Remove events and event_attendance policies
    content = re.sub(r'-- Events: Anyone in the university can see public/university events.*?;\n\n', '', content, flags=re.DOTALL)
    content = re.sub(r'-- Events\ncreate policy "events_select".*?;\n\n', '', content, flags=re.DOTALL)
    content = re.sub(r'-- Event Attendance\ncreate policy "event_attendance_select".*?;\n\n', '', content, flags=re.DOTALL)
    
    content = re.sub(r'drop policy if exists "events_select" on events;\n', '', content)
    content = re.sub(r'create policy "events_select" on events for select using \(.*?\);\n', '', content, flags=re.DOTALL)
    
    # Remove event_attendance stuff that might be left over
    content = re.sub(r'-- Event attendance.*?;\n', '', content, flags=re.DOTALL)
    
    # Let's just do a clean pass over the file and remove lines matching events explicitly where safe
    new_lines = []
    skip = False
    for line in content.split('\n'):
        if line.startswith('create table events '):
            skip = True
        if skip and line.startswith(');'):
            skip = False
            continue
        if skip:
            continue
            
        if line.startswith('create table event_attendance '):
            skip = True
        if skip and line.startswith(');'):
            skip = False
            continue
        if skip:
            continue
            
        if 'on events(' in line or 'on events (' in line or 'table events enable row' in line or 'table event_attendance enable row' in line:
            continue
            
        # skip policies
        if 'on events for' in line or 'on event_attendance for' in line or 'on events;' in line or 'on event_attendance;' in line:
            continue
            
        new_lines.append(line)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))

if __name__ == '__main__':
    main()
