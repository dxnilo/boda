import pandas as pd
import json
import re

def process_guests():
    df = pd.read_excel('MATRIMONIO EN LINEA.xlsx', header=None, skiprows=3)
    
    # Columns: 1=COD, 2=NOMBRE/FAMILIA, 3=PERSONAS, 4=FORMA_ENVIO, 5=GRUPO
    guests = []
    total_personas = 0
    
    for _, row in df.iterrows():
        cod = str(row[1]).strip()
        nombre = str(row[2]).strip()
        personas = row[3]
        grupo = str(row[5]).strip()
        
        # Skip empty / header / total rows
        if cod == 'nan' or nombre == 'nan' or nombre == 'NOMBRE / FAMILIA':
            continue
        if nombre == 'TOTAL INVITADOS' or cod == 'COD':
            continue

        personas = int(personas) if not pd.isna(personas) else 1
        total_personas += personas

        # ---- CASE 1: Separador " & " o " y " con 2 personas ----
        # Check for splitting patterns
        has_ampersand = ' & ' in nombre
        has_y = bool(re.search(r'\s+y\s+', nombre))
        has_dash = ' - ' in nombre
        
        # Determine the right splitter
        if has_ampersand:
            splitter = ' & '
        elif has_y:
            splitter = re.split(r'\s+y\s+', nombre)
        elif has_dash:
            splitter = ' - '
        else:
            splitter = None
        
        # Split into parts
        if splitter and isinstance(splitter, list):
            parts = [p.strip() for p in splitter]
        elif splitter and isinstance(splitter, str):
            parts = [p.strip() for p in nombre.split(splitter)]
        else:
            parts = [nombre]
        
        # ---- Now assign based on number of personas vs parts ----
        
        if personas == 1 and len(parts) >= 1:
            # Single person (even if the name had "&", PERSONAS=1 means 1 cupo)
            guests.append({
                "codigo": cod,
                "nombre": nombre,  # keep original full name
                "grupo": grupo if grupo != 'nan' else '',
                "cupos": personas,
                "es_acompanante": False,
                "acompanante_de": None
            })
            
        elif len(parts) >= 2 and personas >= 2:
            # Multiple named people we can split
            primary = parts[0]
            guests.append({
                "codigo": cod,
                "nombre": primary,
                "grupo": grupo if grupo != 'nan' else '',
                "cupos": personas,
                "es_acompanante": False,
                "acompanante_de": None
            })
            
            for idx, companion_name in enumerate(parts[1:]):
                guests.append({
                    "codigo": f"{cod}-C{idx+1}",
                    "nombre": companion_name,
                    "grupo": grupo if grupo != 'nan' else '',
                    "cupos": 0,
                    "es_acompanante": True,
                    "acompanante_de": primary
                })
            
            # If personas > number of named people, add unnamed slots
            named_count = len(parts)
            if personas > named_count:
                for extra in range(personas - named_count):
                    guests.append({
                        "codigo": f"{cod}-X{extra+1}",
                        "nombre": f"Acompañante de {primary} #{extra+1}",
                        "grupo": grupo if grupo != 'nan' else '',
                        "cupos": 0,
                        "es_acompanante": True,
                        "acompanante_de": primary
                    })
        
        elif len(parts) == 1 and personas >= 2:
            # Family or group name without splittable names (e.g., "Familia Romero" = 4)
            primary_name = parts[0]
            guests.append({
                "codigo": cod,
                "nombre": primary_name,
                "grupo": grupo if grupo != 'nan' else '',
                "cupos": personas,
                "es_acompanante": False,
                "acompanante_de": None
            })
            
            # Create the remaining companion slots
            for slot in range(personas - 1):
                guests.append({
                    "codigo": f"{cod}-M{slot+1}",
                    "nombre": f"Miembro de {primary_name} #{slot+1}",
                    "grupo": grupo if grupo != 'nan' else '',
                    "cupos": 0,
                    "es_acompanante": True,
                    "acompanante_de": primary_name
                })
        else:
            # Fallback
            guests.append({
                "codigo": cod,
                "nombre": nombre,
                "grupo": grupo if grupo != 'nan' else '',
                "cupos": personas,
                "es_acompanante": False,
                "acompanante_de": None
            })

    # Save
    with open('guest_list.json', 'w', encoding='utf-8') as f:
        json.dump(guests, f, indent=4, ensure_ascii=False)

    print(f"✅ Procesado correctamente!")
    print(f"   Códigos de invitación: {len(set(g['codigo'].split('-')[0] for g in guests))}")
    print(f"   Total registros individuales: {len(guests)}")
    print(f"   Total PERSONAS del Excel: {total_personas}")
    
    # Verify match
    if len(guests) == total_personas:
        print(f"   ✔️  MATCH PERFECTO: {len(guests)} registros == {total_personas} personas del Excel")
    else:
        print(f"   ⚠️  MISMATCH: {len(guests)} registros vs {total_personas} personas del Excel")
        print(f"   Diferencia: {len(guests) - total_personas}")
    
    # Print summary by group
    from collections import Counter
    groups = Counter(g['grupo'] for g in guests)
    print(f"\n   Por grupo:")
    for grp, count in sorted(groups.items()):
        print(f"      {grp}: {count}")

if __name__ == '__main__':
    process_guests()
