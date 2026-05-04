
with open(r'c:\Users\Amor\Desktop\WondarEthiopia\wonderethiopia\app\business\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Indentations of 32, 34 spaces etc.
# We want to insert the closing tags before section 4 and at the end of the grid.

# Current mess around 1805:
# 1803:                                     </div>
# 1804:                                   </div>
# 1805:                                 </div>
# 1806: 
# 1807:                                 {/* 4. Features & Comfort Parameters */}
# 1808:                                 <div className="space-y-6">
# 1809:                                 </div>
# 1810:                                 {/* Right Hemisphere: Features, Roles & Governance */}
# 1811:                                 <div className="space-y-12">
# 1812:                                   <div ...>4. Features & Comfort Artifacts</div>

# We want:
# 1805:                                 </div>
# 1805.1:                             </div> <!-- Close Left -->
# 1805.2: 
# 1805.3:                             {/* Right Hemisphere... */}
# 1805.4:                             <div className="space-y-12">
# 1808:                                 <div className="space-y-6">

# And at the end (around 1953)
# 1952:                                 </div> <!-- Close Full Width -->
# 1952.1:                             </div> <!-- Close Grid -->

# Let's find the lines by content to be safe.

new_lines = []
for i, line in enumerate(lines):
    if '{/* 4. Features & Comfort Parameters */}' in line:
        # Before this comment, we should have closed Section 3 and Left Hemisphere
        # But Section 3 is closed by the preceding '</div>'
        # Let's check if the last line was '</div>'
        if i > 0 and '</div>' in lines[i-2]: # line 1805 in view_file
             # We want to insert '</div>' (Close Left) and '<Right>' start here
             # And we'll skip the 'space-y-6' and Right header we added wrongly
             pass 
    
    # Actually, I'll just rewrite the whole block from 1700 to 1960.
    # It's safer.
    new_lines.append(line)

# No, I'll just do a hard-coded line replacement if I'm sure of the lines.
# 1805 is line 1804 (0-indexed).
# 1809 is line 1808.
# 1811 is line 1810.

# Let's just fix it properly.
lines[1805] = '                               </div>\n' # line 1806: Close Left
lines[1806] = '\n' # line 1807
lines[1807] = '                               {/* Right Hemisphere: Features, Roles & Governance */}\n'
lines[1808] = '                               <div className="space-y-12">\n'
lines[1809] = '                                 <div className="space-y-6">\n' # Re-open Section 4
lines[1810] = '                                   <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 border-l-4 border-primary pl-4">4. Features & Comfort Artifacts</div>\n'

# And closing at the end.
# 1953 is line 1952.
lines[1952] = '                               </div>\n' # line 1953: Close Grid
lines[1953] = '                             </div>\n' # line 1954: Close Container
lines[1954] = '                           </div>\n' # line 1955: Close Block
lines[1955] = '                         )}\n'

with open(r'c:\Users\Amor\Desktop\WondarEthiopia\wonderethiopia\app\business\dashboard\page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
