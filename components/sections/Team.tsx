import React from 'react';
import { useTranslation } from 'next-i18next';
import Section from '../common/Section';
import SectionTitle from '../common/SectionTitle';
import Card from '../common/Card';
import TeamMemberCard from './TeamMemberCard';
import { team } from '../../config/team';
import { projects } from '../../config/projects';

const Team: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <Section id="team" background="default">
      <SectionTitle
        title={t('team.title')}
        subtitle={t('team.subtitle')}
      />

      {/* Dos socios: una columna en móvil, dos en desktop. La grilla sale de
          `config/team.ts`; añadir un integrante no toca este JSX. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {team.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>

      {/* Proyectos — va ANTES de Valores: quién somos → qué hemos hecho →
          cómo trabajamos. La prueba concreta pesa más que la declaración de
          principios, así que se lee primero.
          El bloque entero (encabezado incluido) es condicional: con el array
          vacío no queda un título huérfano sobre la nada. */}
      {projects.length > 0 && (
        <div className="mt-20 md:mt-24">
          <SectionTitle title={t('projects.title')} />

          {/* Un solo caso hoy. `md:only:` (mismo recurso que Contact usa para
              el canal único) lo centra y le pone tope de ancho en vez de
              dejarlo huérfano a la izquierda con dos huecos; con dos o más
              casos la regla no aplica y vuelve la grilla normal. */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="h-full md:only:col-span-full md:only:w-full md:only:max-w-xl md:only:justify-self-center"
              >
                <div className="space-y-4">
                  {/* Sector + año: metadato, en mono como el resto de labels
                      (DESIGN-SPEC §8). */}
                  <p className="font-mono text-eyebrow uppercase text-text-subtle">
                    {t(`projects.sectors.${project.sector}`)} · {project.year}
                  </p>

                  <h3 className="text-xl md:text-2xl font-bold text-text">
                    {t(project.title)}
                  </h3>

                  <p className="text-sm md:text-base text-text-muted leading-relaxed">
                    {t(project.summary)}
                  </p>

                  {/* `metric` es opcional y este caso no la tiene: si falta,
                      no se pinta nada (ni label vacío ni guion). */}
                  {project.metric && (
                    <p className="flex items-baseline gap-2">
                      <span className="font-mono text-2xl font-bold text-text">
                        {project.metric.value}
                      </span>
                      <span className="text-sm text-text-muted">
                        {t(project.metric.label)}
                      </span>
                    </p>
                  )}

                  {/* Tags: tecnología, no traducibles. Sin hover en acento —
                      no son clicables (DESIGN-SPEC §1). */}
                  <ul className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <li
                        key={tag}
                        className="px-3 py-1 rounded-full bg-surface-raised border border-border font-mono text-caption text-text-muted"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>

                  {/* Único elemento accionable de la tarjeta → único en acento. */}
                  {project.href && (
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm md:text-base text-accent hover:text-accent-hover transition-colors duration-200 ease-standard"
                    >
                      {t('projects.viewProject')}
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Valores */}
      <div className="mt-20 md:mt-24">
        <SectionTitle title={t('values.title')} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {['smallBusiness', 'development', 'innovation'].map((value) => (
            <div
              key={value}
              className="p-6 md:p-8 rounded-lg bg-surface border border-border hover:border-border-strong transition-colors duration-200 ease-standard"
            >
              <h3 className="text-xl md:text-2xl font-bold text-text mb-4">
                {t(`values.${value}.title`)}
              </h3>
              <p className="text-sm md:text-base text-text-muted leading-relaxed">
                {t(`values.${value}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default Team;
