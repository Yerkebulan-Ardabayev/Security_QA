/**
 * Карта синонимов и связанных понятий для поиска по DevOps и кибербезопасности.
 *
 * Когда пользователь говорит «слой» — расширяем запрос до:
 *   слой → layer, image layer, уровень, overlay
 *
 * Формат: ключ = любое слово которое может произнести пользователь,
 *          значение = массив синонимов/связанных терминов для расширения поиска.
 *
 * ВСЕ ключи lowercase!
 */

const SYNONYM_MAP: Record<string, string[]> = {
  // === Слой / Layer ===
  'слой':      ['layer', 'слой', 'image layer', 'overlay', 'уровень'],
  'слои':      ['layer', 'слои', 'layers', 'image layer', 'overlay', 'уровень'],
  'layer':     ['layer', 'слой', 'image layer', 'overlay'],
  'layers':    ['layers', 'layer', 'слой', 'image layer'],

  // === Образ / Image ===
  'образ':     ['image', 'образ', 'docker-image', 'docker image', 'контейнер'],
  'образы':    ['image', 'образ', 'docker-image', 'images'],
  'image':     ['image', 'образ', 'docker-image', 'docker image'],

  // === Контейнер / Container ===
  'контейнер':     ['контейнер', 'container', 'docker', 'docker-контейнер'],
  'контейнеры':    ['контейнер', 'container', 'контейнеризация', 'docker'],
  'container':     ['container', 'контейнер', 'docker'],

  // === Сеть / Network ===
  'сеть':      ['сеть', 'network', 'сети', 'networking', 'tcp', 'ip', 'dns'],
  'сети':      ['сети', 'network', 'сеть', 'networking', 'tcp', 'ip'],
  'network':   ['network', 'сеть', 'networking'],

  // === Под / Pod ===
  'под':       ['pod', 'под', 'контейнер', 'k8s'],
  'поды':      ['pod', 'поды', 'pods'],
  'pod':       ['pod', 'под', 'контейнер'],

  // === Том / Volume ===
  'том':       ['volume', 'том', 'volumes', 'storage', 'хранилище', 'mount'],
  'тома':      ['volume', 'тома', 'volumes', 'storage'],
  'volume':    ['volume', 'том', 'mount', 'storage'],
  'volumes':   ['volumes', 'volume', 'тома', 'mount'],

  // === Хранение / Storage ===
  'хранение':   ['storage', 'хранение', 'хранилище', 'volume', 'ceph', 'minio', 'pv', 'pvc'],
  'хранилище':  ['storage', 'хранилище', 'volume', 'ceph', 'minio'],
  'storage':    ['storage', 'хранение', 'хранилище', 'volume'],

  // === Безопасность / Security ===
  'безопасность':   ['безопасность', 'security', 'секрет', 'secret', 'шифрование', 'tls', 'ssl'],
  'security':       ['security', 'безопасность', 'секрет', 'secret'],
  'секрет':         ['секрет', 'secret', 'secrets', 'vault', 'hashicorp'],
  'secret':         ['secret', 'секрет', 'secrets', 'vault'],

  // === Мониторинг / Monitoring ===
  'мониторинг':     ['мониторинг', 'monitoring', 'prometheus', 'grafana', 'observability', 'метрики'],
  'monitoring':     ['monitoring', 'мониторинг', 'prometheus', 'grafana'],
  'метрики':        ['метрики', 'metrics', 'prometheus', 'мониторинг'],

  // === Логи / Logs ===
  'логи':      ['логи', 'logs', 'логирование', 'logging', 'elk', 'logstash', 'kibana'],
  'логирование':  ['логирование', 'logging', 'логи', 'logs', 'elk'],
  'logs':      ['logs', 'логи', 'logging', 'логирование'],

  // === Деплой / Deploy ===
  'деплой':    ['deploy', 'деплой', 'deployment', 'развёртывание', 'ci/cd', 'pipeline'],
  'deploy':    ['deploy', 'деплой', 'deployment', 'развёртывание'],
  'развёртывание':  ['развёртывание', 'deploy', 'deployment', 'деплой'],

  // === Пайплайн / Pipeline ===
  'пайплайн':  ['pipeline', 'пайплайн', 'ci/cd', 'jenkins', 'gitlab ci'],
  'pipeline':  ['pipeline', 'пайплайн', 'ci/cd'],

  // === Модель OSI ===
  'osi':       ['osi', 'модель osi', 'tcp/ip', 'уровень', 'layer', 'сеть'],
  'оси':       ['osi', 'модель osi', 'tcp/ip', 'уровень'],

  // === Репликация / Replication ===
  'репликация':  ['репликация', 'replication', 'реплика', 'master', 'slave', 'primary', 'replica'],
  'replication': ['replication', 'репликация', 'реплика'],

  // === Балансировка / Load Balancing ===
  'балансировка':  ['балансировка', 'load balancing', 'load balancer', 'balancer', 'haproxy', 'nginx', 'ingress'],
  'балансировщик': ['балансировщик', 'load balancer', 'balancer', 'haproxy', 'nginx'],

  // === Кластер / Cluster ===
  'кластер':   ['кластер', 'cluster', 'нода', 'node', 'кворум'],
  'cluster':   ['cluster', 'кластер', 'node'],

  // === Нода / Node ===
  'нода':      ['нода', 'node', 'узел', 'worker', 'master'],
  'node':      ['node', 'нода', 'узел'],
  'узел':      ['узел', 'node', 'нода'],

  // === Сервис / Service ===
  'сервис':    ['сервис', 'service', 'микросервис', 'microservice'],
  'service':   ['service', 'сервис', 'микросервис'],
  'микросервис':  ['микросервис', 'microservice', 'сервис', 'service'],

  // === Namespace ===
  'неймспейс':    ['namespace', 'неймспейс', 'пространство имён'],
  'namespace':    ['namespace', 'неймспейс', 'пространство'],

  // === Конфигурация / Config ===
  'конфигурация':  ['конфигурация', 'config', 'configmap', 'configuration', 'настройка'],
  'конфиг':        ['конфиг', 'config', 'configmap', 'конфигурация'],
  'config':        ['config', 'конфигурация', 'configmap'],

  // === Процесс / Process ===
  'процесс':   ['процесс', 'process', 'pid', 'systemd', 'daemon'],
  'process':   ['process', 'процесс', 'pid'],

  // === Файловая система / Filesystem ===
  'файловая':  ['файловая', 'filesystem', 'inode', 'файл', 'диск'],
  'файл':      ['файл', 'file', 'filesystem', 'inode'],
  'диск':      ['диск', 'disk', 'storage', 'файловая', 'lvm', 'raid'],

  // === Память / Memory ===
  'память':    ['память', 'memory', 'ram', 'oom', 'swap', 'swappiness'],
  'memory':    ['memory', 'память', 'ram', 'oom'],
  'oom':       ['oom', 'oomkilled', 'память', 'memory', 'out of memory'],

  // === Масштабирование / Scaling ===
  'масштабирование':  ['масштабирование', 'scaling', 'autoscaling', 'hpa', 'scale'],
  'scaling':          ['scaling', 'масштабирование', 'autoscaling', 'hpa'],

  // === DNS ===
  'dns':       ['dns', 'домен', 'domain', 'resolve', 'имена'],

  // === Сертификат / Certificate ===
  'сертификат':  ['сертификат', 'certificate', 'tls', 'ssl', 'https', 'cert'],
  'certificate': ['certificate', 'сертификат', 'tls', 'ssl'],
  'tls':         ['tls', 'ssl', 'сертификат', 'certificate', 'https'],

  // === Бэкап / Backup ===
  'бэкап':     ['бэкап', 'backup', 'резервное', 'восстановление', 'restore'],
  'backup':    ['backup', 'бэкап', 'резервное', 'восстановление'],

  // === Архитектура / Architecture ===
  'архитектура':  ['архитектура', 'architecture', 'дизайн', 'паттерн', 'микросервис'],
  'architecture': ['architecture', 'архитектура', 'дизайн'],

  // === Авторизация / Auth ===
  'авторизация':  ['авторизация', 'authorization', 'аутентификация', 'authentication', 'oauth', 'mfa', 'rbac'],
  'аутентификация':  ['аутентификация', 'authentication', 'авторизация', 'mfa', 'totp'],
  'rbac':        ['rbac', 'role', 'роль', 'авторизация', 'доступ'],

  // ===== Кибербезопасность =====
  'уязвимость':   ['уязвимость', 'vulnerability', 'cve', 'cvss', 'эксплойт'],
  'уязвимости':   ['уязвимости', 'vulnerability', 'vulnerabilities', 'cve', 'cvss'],
  'vulnerability': ['vulnerability', 'уязвимость', 'cve'],
  'инцидент':     ['инцидент', 'incident', 'реагирование', 'response', 'ir'],
  'incident':     ['incident', 'инцидент', 'реагирование'],
  'реагирование': ['реагирование', 'response', 'incident', 'инцидент', 'ir'],
  'сием':         ['siem', 'splunk', 'wazuh', 'корреляция', 'логи'],
  'siem':         ['siem', 'корреляция', 'splunk', 'wazuh'],
  'сок':          ['soc', 'siem', 'аналитик', 'мониторинг'],
  'soc':          ['soc', 'siem', 'аналитик'],
  'корреляция':   ['корреляция', 'correlation', 'siem', 'правило'],
  'форензика':    ['форензика', 'forensics', 'криминалистика', 'dfir', 'расследование'],
  'криминалистика': ['криминалистика', 'forensics', 'форензика', 'dfir'],
  'forensics':    ['forensics', 'форензика', 'криминалистика', 'dfir'],
  'расследование': ['расследование', 'investigation', 'dfir', 'форензика', 'инцидент'],
  'пентест':      ['пентест', 'pentest', 'тестирование на проникновение', 'penetration'],
  'pentest':      ['pentest', 'пентест', 'penetration'],
  'шифрование':   ['шифрование', 'encryption', 'aes', 'rsa', 'tls', 'криптография'],
  'encryption':   ['encryption', 'шифрование', 'aes', 'rsa'],
  'криптография': ['криптография', 'cryptography', 'шифрование', 'хеш', 'подпись'],
  'хеш':          ['хеш', 'hash', 'sha', 'хеширование', 'bcrypt'],
  'хэш':          ['хэш', 'хеш', 'hash', 'sha'],
  'hash':         ['hash', 'хеш', 'sha'],
  'подпись':      ['подпись', 'signature', 'эцп', 'pki', 'сертификат'],
  'фишинг':       ['фишинг', 'phishing', 'социальная инженерия'],
  'phishing':     ['phishing', 'фишинг'],
  'вредонос':     ['вредонос', 'malware', 'вредоносное', 'ransomware', 'вирус'],
  'malware':      ['malware', 'вредонос', 'вредоносное', 'ransomware'],
  'вымогатель':   ['вымогатель', 'ransomware', 'шифровальщик'],
  'шифровальщик': ['шифровальщик', 'ransomware', 'вымогатель'],
  'инъекция':     ['инъекция', 'injection', 'sql injection', 'sqli', 'внедрение'],
  'injection':    ['injection', 'инъекция', 'sqli', 'внедрение'],
  'овасп':        ['owasp', 'top 10', 'asvs'],
  'митре':        ['mitre', 'att&ck', 'attack', 'техника', 'тактика'],
  'mitre':        ['mitre', 'att&ck', 'тактика', 'техника'],
  'комплаенс':    ['комплаенс', 'compliance', 'grc', 'iso', 'pci', 'соответствие'],
  'compliance':   ['compliance', 'комплаенс', 'grc', 'соответствие'],
  'риск':         ['риск', 'risk', 'угроза', 'оценка рисков', 'grc'],
  'риски':        ['риски', 'risk', 'риск', 'угроза', 'grc'],
  'угроза':       ['угроза', 'threat', 'риск', 'модель угроз'],
  'угрозы':       ['угрозы', 'threat', 'threats', 'модель угроз'],
  'персональные': ['персональные', 'персональных', 'пдн', 'personal data', 'gdpr'],
  'пдн':          ['пдн', 'персональные', 'персональных', 'personal data'],
  'зависимости':  ['зависимости', 'dependencies', 'sca', 'sbom', 'supply chain'],
  'цепочка':      ['цепочка', 'supply chain', 'sbom', 'slsa'],
  'сканирование': ['сканирование', 'scan', 'scanning', 'nmap', 'sast', 'dast'],
  'сканер':       ['сканер', 'scanner', 'nmap', 'sast', 'dast'],
  'доступ':       ['доступ', 'access', 'iam', 'rbac', 'привилегии'],
  'привилегии':   ['привилегии', 'privilege', 'least privilege', 'pam', 'эскалация'],
  'эскалация':    ['эскалация', 'escalation', 'privilege escalation', 'привилегии'],
  'фаервол':      ['фаервол', 'firewall', 'межсетевой экран', 'waf'],
  'файрвол':      ['файрвол', 'firewall', 'межсетевой экран', 'waf'],
  'firewall':     ['firewall', 'межсетевой экран', 'фаервол'],
  'ии':           ['ии', 'ai', 'искусственный интеллект', 'llm', 'модель'],
  'ai':           ['ai', 'ии', 'искусственный интеллект', 'llm'],
  'llm':          ['llm', 'ии', 'ai', 'модель', 'промпт'],
  'ллм':          ['llm', 'ии', 'ai', 'модель'],
  'промпт':       ['промпт', 'prompt', 'prompt injection', 'инъекция', 'llm'],
  'prompt':       ['prompt', 'промпт', 'prompt injection', 'llm'],
  'агент':        ['агент', 'agent', 'agency', 'агентность', 'llm'],
  'rag':          ['rag', 'вектор', 'эмбеддинг', 'embedding', 'llm'],
  'вектор':       ['вектор', 'vector', 'эмбеддинг', 'embedding', 'rag'],
  'эмбеддинг':    ['эмбеддинг', 'embedding', 'вектор', 'vector', 'rag'],
  'квантовый':    ['квантовый', 'quantum', 'постквантовый', 'pqc', 'ml-kem'],
  'постквантовый': ['постквантовый', 'пост-квантовый', 'pqc', 'quantum', 'ml-kem', 'ml-dsa'],
  'pqc':          ['pqc', 'постквантовый', 'quantum', 'ml-kem', 'ml-dsa', 'slh-dsa'],
  'казахстан':    ['казахстан', 'рк', 'kazakhstan', 'адилет', 'adilet', 'закон'],
  'рк':           ['рк', 'казахстан', 'kazakhstan', 'закон'],
  'кибербезопасность': ['кибербезопасность', 'cybersecurity', 'киберзащита', 'закон'],
};

/**
 * Расширяет список терминов синонимами.
 * Например: ['слой'] → ['слой', 'layer', 'image layer', 'overlay', 'уровень']
 */
export function expandWithSynonyms(terms: string[]): string[] {
  const expanded = new Set<string>();

  for (const t of terms) {
    expanded.add(t);
    const syns = SYNONYM_MAP[t];
    if (syns) {
      for (const s of syns) {
        expanded.add(s.toLowerCase());
      }
    }
  }

  return Array.from(expanded);
}
